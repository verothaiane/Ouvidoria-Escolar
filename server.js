const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json()); 
app.use(cors()); 

// Configuração da conexão com o MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: 'Veronesetcvr1@',      // Coloque sua senha do MySQL aqui, se houver
    database: 'ouvidoria_escolar'
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

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000: http://localhost:3000');
});