CREATE DATABASE IF NOT EXISTS sistema_clientes;
USE sistema_clientes;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

USE sistema_clientes;

CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INT DEFAULT 0,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('admin', 'operador') DEFAULT 'operador',
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'pago', 'cancelado') DEFAULT 'pendente',
    valor_total DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

------------------------------------------------------------------------------

use sistema_chamados_hospital;

select * from funcionario;

use sistema_clientes;

select * from produtos;

INSERT INTO clientes (nome, email, telefone, status) VALUES
('João da Silva', 'joao.silva@email.com', '47999990001', 'ativo'),
('Maria Oliveira', 'maria.oliveira@email.com', '47999990002', 'ativo'),
('Pedro Santos', 'pedro.santos@email.com', '47999990003', 'ativo'),
('Ana Costa', 'ana.costa@email.com', '47999990004', 'ativo'),
('Lucas Pereira', 'lucas.pereira@email.com', '47999990005', 'ativo');

INSERT INTO produtos (nome, descricao, preco, estoque, status) values
('Mouse Logitech', 'Mouse sem fio', 120.00, 25, 'ativo'),
('Monitor Samsung', 'Monitor Full HD 24 polegadas', 900.00, 8, 'ativo'),
('Headset HyperX', 'Headset gamer com microfone', 350.00, 12, 'ativo');
-- o Notebook e o Teclado foram inseridos direto no Postman, para realização dos testes.

INSERT INTO usuarios (nome, email, senha, perfil, status) VALUES
('Administrador', 'admin@email.com', '123456', 'admin', 'ativo'),
('Carlos Souza', 'carlos.souza@email.com', '123456', 'operador', 'ativo'),
('Fernanda Lima', 'fernanda.lima@email.com', '123456', 'operador', 'ativo'),
('Rafael Mendes', 'rafael.mendes@email.com', '123456', 'operador', 'ativo'),
('Juliana Alves', 'juliana.alves@email.com', '123456', 'operador', 'ativo');

INSERT INTO pedidos (cliente_id, status, valor_total) VALUES
(1, 'pago', 3620.00),
(2, 'pago', 1150.00),
(3, 'pendente', 1250.00),
(4, 'pago', 700.00),
(5, 'pendente', 1020.00);

INSERT INTO itens_pedido 
(pedido_id, produto_id, quantidade, preco_unitario) 
VALUES

(1, 1, 1, 3200.00),
(1, 2, 1, 120.00),

(2, 3, 1, 250.00),
(2, 4, 1, 900.00),

(3, 4, 1, 900.00),
(3, 5, 1, 350.00),

(4, 5, 1, 350.00),
(4, 2, 1, 120.00),
(4, 2, 1, 120.00),

(5, 1, 1, 3200.00),
(5, 3, 1, 250.00);