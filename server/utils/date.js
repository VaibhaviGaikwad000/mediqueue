const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.TZ_NAME || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function dayName(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) return null;
  const d = new Date(`${dateString}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== dateString) return null;
  return WEEKDAYS[d.getUTCDay()];
}
function isValidDateString(dateString) { return dayName(dateString) !== null; }
module.exports = { today, dayName, isValidDateString };
