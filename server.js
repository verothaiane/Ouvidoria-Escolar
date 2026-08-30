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

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000: http://localhost:3000');
});