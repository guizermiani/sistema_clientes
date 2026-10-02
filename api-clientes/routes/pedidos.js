const express = require('express');
const router = express.Router();
const db = require('../db');


// CREATE - Criar pedido
router.post('/', async (req, res) => {
    const { cliente_id } = req.body;

    if (!cliente_id) {
        return res.status(400).json({
            mensagem: 'cliente_id é obrigatório.'
        });
    }

    try {
        // Verifica se o cliente existe
        const [cliente] = await db.execute(
            'SELECT id FROM clientes WHERE id = ?',
            [cliente_id]
        );

        if (cliente.length === 0) {
            return res.status(404).json({
                mensagem: 'Cliente não encontrado.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO pedidos (cliente_id)
             VALUES (?)`,
            [cliente_id]
        );

        res.status(201).json({
            mensagem: 'Pedido criado com sucesso.',
            id: result.insertId,
            cliente_id,
            status: 'pendente',
            valor_total: 0
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao criar pedido.',
            detalhes: error.message
        });
    }
});


// READ - Listar pedidos
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                p.id,
                p.data_pedido,
                p.status,
                p.valor_total,
                c.id AS cliente_id,
                c.nome AS cliente_nome,
                c.email AS cliente_email
            FROM pedidos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            ORDER BY p.id DESC
        `);

        res.status(200).json(rows);

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao buscar pedidos.',
            detalhes: error.message
        });
    }
});


// READ - Buscar pedido completo
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Busca o pedido e o cliente
        const [pedidos] = await db.execute(`
            SELECT
                p.id,
                p.data_pedido,
                p.status,
                p.valor_total,
                c.id AS cliente_id,
                c.nome AS cliente_nome,
                c.email AS cliente_email,
                c.telefone AS cliente_telefone
            FROM pedidos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (pedidos.length === 0) {
            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        // Busca os itens do pedido
        const [itens] = await db.execute(`
            SELECT
                ip.id,
                ip.pedido_id,
                ip.produto_id,
                pr.nome AS produto_nome,
                ip.quantidade,
                ip.preco_unitario,
                (ip.quantidade * ip.preco_unitario) AS subtotal
            FROM itens_pedido ip
            INNER JOIN produtos pr ON ip.produto_id = pr.id
            WHERE ip.pedido_id = ?
        `, [id]);

        const pedido = pedidos[0];

        res.status(200).json({
            id: pedido.id,
            data_pedido: pedido.data_pedido,
            status: pedido.status,
            valor_total: pedido.valor_total,

            cliente: {
                id: pedido.cliente_id,
                nome: pedido.cliente_nome,
                email: pedido.cliente_email,
                telefone: pedido.cliente_telefone
            },

            itens: itens
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao buscar pedido.',
            detalhes: error.message
        });
    }
});


// PATCH - Atualizar somente o status do pedido
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = [
        'pendente',
        'pago',
        'cancelado'
    ];

    if (!status) {
        return res.status(400).json({
            mensagem: 'O status é obrigatório.'
        });
    }

    if (!statusPermitidos.includes(status)) {
        return res.status(400).json({
            mensagem: 'Status inválido. Use: pendente, pago ou cancelado.'
        });
    }

    try {
        const [result] = await db.execute(
            `UPDATE pedidos
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        res.status(200).json({
            mensagem: 'Status do pedido atualizado com sucesso.',
            status
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao atualizar status do pedido.',
            detalhes: error.message
        });
    }
});


// POST - Adicionar item ao pedido
router.post('/:id/itens', async (req, res) => {
    const { id } = req.params;
    const {
        produto_id,
        quantidade,
        preco_unitario
    } = req.body;

    if (!produto_id || !quantidade || preco_unitario === undefined) {
        return res.status(400).json({
            mensagem: 'produto_id, quantidade e preco_unitario são obrigatórios.'
        });
    }

    if (quantidade <= 0) {
        return res.status(400).json({
            mensagem: 'A quantidade deve ser maior que zero.'
        });
    }

    if (preco_unitario < 0) {
        return res.status(400).json({
            mensagem: 'O preço unitário não pode ser negativo.'
        });
    }

    try {
        // Verifica se o pedido existe
        const [pedido] = await db.execute(
            'SELECT id FROM pedidos WHERE id = ?',
            [id]
        );

        if (pedido.length === 0) {
            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        // Verifica se o produto existe
        const [produto] = await db.execute(
            'SELECT id FROM produtos WHERE id = ?',
            [produto_id]
        );

        if (produto.length === 0) {
            return res.status(404).json({
                mensagem: 'Produto não encontrado.'
            });
        }

        // Insere o item
        const [result] = await db.execute(
            `INSERT INTO itens_pedido
            (pedido_id, produto_id, quantidade, preco_unitario)
            VALUES (?, ?, ?, ?)`,
            [
                id,
                produto_id,
                quantidade,
                preco_unitario
            ]
        );

        // Atualiza o valor total do pedido
        await db.execute(
            `UPDATE pedidos
             SET valor_total = valor_total + ?
             WHERE id = ?`,
            [
                quantidade * preco_unitario,
                id
            ]
        );

        res.status(201).json({
            mensagem: 'Item adicionado ao pedido com sucesso.',
            id: result.insertId,
            pedido_id: Number(id),
            produto_id,
            quantidade,
            preco_unitario,
            subtotal: quantidade * preco_unitario
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao adicionar item ao pedido.',
            detalhes: error.message
        });
    }
});


// DELETE - Remover item do pedido
router.delete('/:id_pedido/itens/:id_item', async (req, res) => {
    const {
        id_pedido,
        id_item
    } = req.params;

    try {
        // Busca o item garantindo que pertence ao pedido informado
        const [itens] = await db.execute(
            `SELECT quantidade, preco_unitario
             FROM itens_pedido
             WHERE id = ? AND pedido_id = ?`,
            [id_item, id_pedido]
        );

        if (itens.length === 0) {
            return res.status(404).json({
                mensagem: 'Item não encontrado neste pedido.'
            });
        }

        const item = itens[0];

        // Remove o item
        await db.execute(
            `DELETE FROM itens_pedido
             WHERE id = ? AND pedido_id = ?`,
            [id_item, id_pedido]
        );
        
        await db.execute(
            `UPDATE pedidos
             SET valor_total = valor_total - ?
             WHERE id = ?`,
            [
                item.quantidade * item.preco_unitario,
                id_pedido
            ]
        );

        res.status(200).json({
            mensagem: 'Item removido do pedido com sucesso.'
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao remover item do pedido.',
            detalhes: error.message
        });
    }
});


module.exports = router;