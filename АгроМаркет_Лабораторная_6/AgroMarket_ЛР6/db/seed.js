import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { pool } from './pool.js';

try {
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  const db = JSON.parse(readFileSync(new URL('../data/db.json', import.meta.url), 'utf8'));
  for (const p of db.products) {
    await pool.query(
      `INSERT INTO products (name, category, price, unit, image)
       VALUES ($1, $2, $3, $4, $5)`,
      [p.name, p.category ?? null, Number(p.price), p.unit ?? 'кг', p.image ?? null],
    );
  }
  console.log(`База инициализирована. Загружено товаров: ${db.products.length}`);
} catch (error) {
  console.error('Не удалось инициализировать базу:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
