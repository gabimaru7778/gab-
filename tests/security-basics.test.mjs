import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
test('scrypt password derivation is stable for a salt',()=>{const p='a long test password',salt=randomBytes(16).toString('hex');assert.equal(timingSafeEqual(scryptSync(p,salt,64),scryptSync(p,salt,64)),true);});
test('session tokens are stored as digests, not plaintext',()=>{const token=randomBytes(32).toString('base64url');const digest=createHash('sha256').update(token).digest('hex');assert.notEqual(digest,token);assert.equal(digest.length,64);});
