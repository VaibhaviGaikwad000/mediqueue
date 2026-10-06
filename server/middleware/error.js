function notFound(req, res, next) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); }
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  if (err.code === 11000) { status = 409; message = `A record with this ${Object.keys(err.keyValue || {})[0] || 'value'} already exists`; }
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
}
module.exports = { notFound, errorHandler };
