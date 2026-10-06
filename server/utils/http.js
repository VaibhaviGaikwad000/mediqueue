function fail(message, status = 400) { return Object.assign(new Error(message), { status }); }
function asyncHandler(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
function validId(value) { return /^[a-f\d]{24}$/i.test(String(value || '')); }
function requireFields(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Request body must be a JSON object');
  const missing = fields.filter(key => body[key] === undefined || body[key] === null || body[key] === '');
  if (missing.length) throw fail(`Missing required fields: ${missing.join(', ')}`);
}
module.exports = { fail, asyncHandler, validId, requireFields };
