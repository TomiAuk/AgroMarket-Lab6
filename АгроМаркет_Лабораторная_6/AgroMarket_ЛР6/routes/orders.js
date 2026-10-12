import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.product_id, o.name, o.email, o.phone, o.quantity,
              o.delivery_date, o.comment, o.status, o.created_at,
              p.name AS product_name
       FROM orders o LEFT JOIN products p ON p.id = o.product_id
       ORDER BY o.created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id = null, name, email, phone = null, quantity, delivery_date = null, comment = null } = req.body ?? {};
    const qty = Number(quantity);
    if (typeof name !== 'string' || name.trim().length < 2 ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !Number.isInteger(qty) || qty < 10) {
      return res.status(400).json({ error: 'Проверьте имя, email и объём: минимум 10 кг' });
    }
    const result = await pool.query(
      `INSERT INTO orders (product_id, name, email, phone, quantity, delivery_date, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [product_id ? Number(product_id) : null, name.trim(), email.trim(), phone, qty, delivery_date || null, comment],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};
    const statuses = ['new', 'processing', 'done', 'cancelled'];
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный id' });
    if (!statuses.includes(status)) return res.status(400).json({ error: 'Недопустимый статус' });
    const result = await pool.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Заявка не найдена' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

export default router;
