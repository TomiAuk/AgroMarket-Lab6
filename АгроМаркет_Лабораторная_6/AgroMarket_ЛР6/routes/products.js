import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const maxPrice = req.query.maxPrice === undefined ? null : Number(req.query.maxPrice);
    const sort = String(req.query.sort ?? '');
    if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
      return res.status(400).json({ error: 'maxPrice должен быть неотрицательным числом' });
    }
    const allowedSorts = { price: 'price ASC', '-price': 'price DESC', name: 'name ASC', '-name': 'name DESC' };
    const orderBy = allowedSorts[sort] || 'id ASC';
    const result = await pool.query(
      `SELECT id, name, category, price, unit, image, created_at
       FROM products
       WHERE ($1 = '' OR name ILIKE '%' || $1 || '%')
         AND ($2::integer IS NULL OR price <= $2)
       ORDER BY ${orderBy}`,
      [search, maxPrice],
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный id' });
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Товар не найден' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category = null, price, unit = 'кг', image = null } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim() || !Number.isInteger(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Нужны name и неотрицательная целая price' });
    }
    const result = await pool.query(
      `INSERT INTO products (name, category, price, unit, image)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), category, Number(price), unit, image],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, category = null, price, unit = 'кг', image = null } = req.body ?? {};
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный id' });
    if (typeof name !== 'string' || !name.trim() || !Number.isInteger(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Нужны name и неотрицательная целая price' });
    }
    const result = await pool.query(
      `UPDATE products SET name=$1, category=$2, price=$3, unit=$4, image=$5
       WHERE id=$6 RETURNING *`,
      [name.trim(), category, Number(price), unit, image, id],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Товар не найден' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный id' });
    const result = await pool.query('DELETE FROM products WHERE id=$1', [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Товар не найден' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
