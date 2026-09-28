import test from 'node:test';
import assert from 'node:assert/strict';
import { getJwtSecret } from '../lib/auth-secret.mjs';
import { validateCredentials } from '../lib/validation.mjs';

test('missing or placeholder JWT secrets fail closed', () => {
  const previous = process.env.JWT_SECRET;
  try {
    for (const secret of ['', 'your-secret-key-change-in-production', 'short']) {
      process.env.JWT_SECRET = secret;
      assert.throws(() => getJwtSecret());
    }
    process.env.JWT_SECRET = 'a'.repeat(48);
    assert.equal(getJwtSecret(), 'a'.repeat(48));
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
test('credentials normalize email and reject query objects', () => {
  assert.deepEqual(validateCredentials({email:'  Aditya@Example.com ',password:'validpass',name:' Aditya '}, true), {email:'aditya@example.com',password:'validpass',name:'Aditya'});
  for (const email of [{ $ne: null }, 42, '', 'invalid']) {
    assert.equal(validateCredentials({ email, password: 'validpass' }), null);
  }
  assert.equal(validateCredentials(null), null);
});
test('signup rejects short passwords, blank names and bcrypt truncation', () => {
  assert.equal(validateCredentials({email:'a@b.com',password:'short',name:'Aditya'},true), null);
  assert.equal(validateCredentials({email:'a@b.com',password:'validpass',name:'  '},true), null);
  assert.equal(validateCredentials({email:'a@b.com',password:'é'.repeat(37),name:'Aditya'},true), null);
});
