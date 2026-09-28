export function validateCredentials(body, signup = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { email, password, name } = body;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return null;
  if (typeof password !== 'string' || password.length < (signup ? 8 : 1) || new TextEncoder().encode(password).length > 72) return null;
  if (signup && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) return null;
  return { email: email.trim().toLowerCase(), password, ...(signup && { name: name.trim() }) };
}

export function isText(value, max = 10000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
export function optionalTopic(value) { return value == null || value === '' || isText(value, 200); }
export function stringList(value) { return value === undefined || (Array.isArray(value) && value.length <= 100 && value.every(item => isText(item, 200))); }
export function parsePagination(params, allowedSorts) {
  const page = Number(params.get('page') || 1);
  const limit = Number(params.get('limit') || 10);
  const sortBy = params.get('sortBy') || 'createdAt';
  const sortOrder = params.get('sortOrder') || 'desc';
  if (!Number.isInteger(page) || page < 1 || page > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 100 || !allowedSorts.includes(sortBy) || !['asc','desc'].includes(sortOrder)) return null;
  return { page, limit, sortBy, sortOrder };
}
