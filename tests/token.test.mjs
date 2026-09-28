import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, hashPassword, comparePassword } from '../lib/auth.js';

test('signed tokens reject tampering and unsupported algorithms', () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'fixture-secret-for-local-regression-tests-only';
  try {
    const token = generateToken('test-user');
    assert.equal(verifyToken(token).userId, 'test-user');
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ userId: 'other-user' })).toString('base64url');
    assert.equal(verifyToken(parts.join('.')), null);
    assert.equal(verifyToken(jwt.sign({ userId: 'other-user' }, process.env.JWT_SECRET, { algorithm: 'HS384' })), null);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
test('password comparisons resolve correctly for correct and incorrect input', async () => {
  const hash = await hashPassword('Regression-password');
  assert.notEqual(hash, 'Regression-password');
  assert.equal(await comparePassword('Regression-password', hash), true);
  assert.equal(await comparePassword('Incorrect-password', hash), false);
});
