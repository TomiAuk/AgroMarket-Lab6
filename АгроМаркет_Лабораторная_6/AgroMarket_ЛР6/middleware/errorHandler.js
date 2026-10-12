export function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  if (err.code === '23505') return res.status(409).json({ error: 'Такая запись уже существует' });
  if (err.code === '23503' || err.code === '23514' || err.code === '23502') {
    return res.status(400).json({ error: 'Данные нарушают ограничения базы данных' });
  }
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
