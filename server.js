const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json()); 
app.use(cors()); 

// Conexão com o Banco de Dados na Nuvem (Aiven)
const db = mysql.createConnection({
    host: 'ouvidoriaescolar-ouvidoria-escolar.b.aivencloud.com', 
    port: 21735,
    user: 'avnadmin',
    password: 'AVNS_z9-pdgQQdweK9ptSh5b',
    database: 'ouvidoria',
    ssl: {
        rejectUnauthorized: false 
    }
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL com sucesso!');
});

// ROTA: Receber um novo relato do Front-end e salvar no Banco
app.post('/api/relatos', (req, res) => {
    const { protocolo, senha, categoria, titulo, descricao, anonimo, contato_nome, contato_vinculo, contato_dado } = req.body;

    const query = `
        INSERT INTO relatos 
        (protocolo, senha_acompanhamento, categoria, titulo, descricao, anonimo, contato_nome, contato_vinculo, contato_dado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [protocolo, senha, categoria, titulo, descricao, anonimo, contato_nome, contato_vinculo, contato_dado], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao salvar o relato' });
        }
        
        // Se salvou o relato, salva também o histórico inicial
        const relatoId = result.insertId;
        const historicoQuery = `INSERT INTO historico_relatos (relato_id, status_momento, observacao) VALUES (?, 'Recebido', 'Relato recebido pela ouvidoria.')`;
        
        db.query(historicoQuery, [relatoId], (err2) => {
            if (err2) console.error('Erro ao salvar histórico:', err2);
            res.status(201).json({ mensagem: 'Relato salvo com sucesso!', id: relatoId });
        });
    });
});

// ROTA 2: Acompanhar o status de um relato
app.post('/api/acompanhar', (req, res) => {
    const { protocolo, senha } = req.body;

    // Busca o relato no banco de dados usando o protocolo e a senha
    const queryRelato = 'SELECT * FROM relatos WHERE protocolo = ? AND senha_acompanhamento = ?';
    
    db.query(queryRelato, [protocolo, senha], (err, results) => {
        if (err) {
            console.error('Erro ao buscar relato:', err);
            return res.status(500).json({ erro: 'Erro no servidor' });
        }

        // Se não encontrar nada, a senha ou protocolo estão errados
        if (results.length === 0) {
            return res.status(404).json({ erro: 'Código ou senha inválidos' });
        }

        const relato = results[0];

        // Se achou o relato, busca o histórico de atualizações dele
        const queryHistorico = 'SELECT status_momento as status, data_registro as date, observacao as note FROM historico_relatos WHERE relato_id = ? ORDER BY data_registro ASC';
        
        db.query(queryHistorico, [relato.id], (err2, historico) => {
            if (err2) {
                console.error('Erro ao buscar histórico:', err2);
                return res.status(500).json({ erro: 'Erro no servidor' });
            }

            // Junta as informações e envia de volta para o site (Front-end)
            res.json({
                titulo: relato.titulo,
                categoria: relato.categoria,
                status: relato.status,
                createdAt: relato.data_criacao,
                history: historico
            });
        });
    });
});

// ROTA 3: Login da Diretoria (Equipe)
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    // Busca no banco se existe um usuário com esse e-mail e senha
    const query = 'SELECT id, nome, email FROM equipe WHERE email = ? AND senha = ?';
    
    db.query(query, [email, senha], (err, results) => {
        if (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ erro: 'Erro no servidor' });
        }

        // Se o resultado for vazio, as credenciais estão erradas
        if (results.length === 0) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
        }

        // Se achou, devolve os dados da diretoria (sem enviar a senha de volta, por segurança)
        const usuario = results[0];
        res.json({ mensagem: 'Login aprovado', usuario: usuario });
    });
});

// ROTA 4: Listar todos os relatos (Painel da Diretoria)
app.get('/api/relatos', (req, res) => {
    // Busca os dados principais para montar a lista, ordenando do mais novo para o mais velho
    const query = 'SELECT protocolo, titulo, categoria, anonimo, contato_nome, status, data_criacao as createdAt FROM relatos ORDER BY data_criacao DESC';
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar a lista' });
        res.json(results);
    });
});

// ROTA 5: Pegar os detalhes completos de um relato específico para abrir no Modal
app.get('/api/relatos/:protocolo', (req, res) => {
    const { protocolo } = req.params;
    const query = 'SELECT * FROM relatos WHERE protocolo = ?';
    
    db.query(query, [protocolo], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ erro: 'Relato não encontrado' });
        
        const relato = results[0];
        
        // Puxa também a linha do tempo desse relato
        const queryHistorico = 'SELECT status_momento as status, data_registro as date, observacao as note FROM historico_relatos WHERE relato_id = ? ORDER BY data_registro ASC';
        
        db.query(queryHistorico, [relato.id], (err2, historico) => {
            if (err2) return res.status(500).json({ erro: 'Erro no histórico' });
            relato.history = historico; // Junta as duas informações
            res.json(relato);
        });
    });
});

// ROTA 6: Atualizar o status do relato (Recebido -> Em Análise -> Concluído)
app.put('/api/relatos/:protocolo/status', (req, res) => {
    const { protocolo } = req.params;
    const { status } = req.body;
    
    // Descobre o ID do relato
    db.query('SELECT id FROM relatos WHERE protocolo = ?', [protocolo], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({erro: 'Relato não encontrado'});
        const relatoId = results[0].id;
        
        // Atualiza a tabela de relatos
        db.query('UPDATE relatos SET status = ? WHERE id = ?', [status, relatoId], (err2) => {
            if (err2) return res.status(500).json({erro: 'Erro ao atualizar'});
            
            // Registra a mudança no histórico
            db.query("INSERT INTO historico_relatos (relato_id, status_momento, observacao) VALUES (?, ?, 'Status atualizado pela equipe.')", [relatoId, status], (err3) => {
                res.json({mensagem: 'Status atualizado com sucesso'});
            });
        });
    });
});

// ROTA 7: Adicionar uma observação interna
app.post('/api/relatos/:protocolo/nota', (req, res) => {
    const { protocolo } = req.params;
    const { note } = req.body;
    
    db.query('SELECT id, status FROM relatos WHERE protocolo = ?', [protocolo], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({erro: 'Relato não encontrado'});
        const relatoId = results[0].id;
        const statusAtual = results[0].status;
        
        db.query("INSERT INTO historico_relatos (relato_id, status_momento, observacao) VALUES (?, ?, ?)", [relatoId, statusAtual, note], (err2) => {
            if (err2) return res.status(500).json({erro: 'Erro ao adicionar nota'});
            res.json({mensagem: 'Nota adicionada com sucesso'});
        });
    });
});

// Define a porta que a nuvem mandar, ou usa a 3000 se estiver no computador
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});