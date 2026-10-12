import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db/pool.js';
import { logger } from './middleware/logger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use(logger);

app.get('/', (req, res) => res.send('АгроМаркет API работает'));
app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (error) { next(error); }
});
app.get('/api/about', (req, res) => {
  res.json({ name: 'АгроМаркет', version: '1.0', author: 'Укажите своё ФИО' });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`API запущен: http://localhost:${PORT}`));

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
