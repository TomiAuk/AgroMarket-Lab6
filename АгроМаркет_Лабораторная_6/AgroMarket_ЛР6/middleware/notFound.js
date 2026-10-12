export function notFound(req, res) {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
}
