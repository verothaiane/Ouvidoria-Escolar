-- Cria o banco de dados
CREATE DATABASE IF NOT EXISTS ouvidoria_escolar;
USE ouvidoria_escolar;

-- Tabela para os membros da equipe (Ouvidoria)
CREATE TABLE equipe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, 
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal de Relatos
CREATE TABLE relatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    protocolo VARCHAR(20) NOT NULL UNIQUE, 
    senha_acompanhamento VARCHAR(50) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    anonimo BOOLEAN NOT NULL DEFAULT 1,
    contato_nome VARCHAR(150) NULL,
    contato_vinculo VARCHAR(100) NULL,
    contato_dado VARCHAR(150) NULL, 
    
    status ENUM('Recebido', 'Em análise', 'Concluído') DEFAULT 'Recebido',
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para o histórico e anotações internas da equipe
CREATE TABLE historico_relatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    relato_id INT NOT NULL,
    status_momento VARCHAR(50) NOT NULL,
    observacao TEXT NULL,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (relato_id) REFERENCES relatos(id) ON DELETE CASCADE
);