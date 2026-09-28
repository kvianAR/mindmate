export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || /your-secret|change-me|replace-me/i.test(secret)) {
    throw new Error('Configure JWT_SECRET with at least 32 random characters');
  }
  return secret;
}
