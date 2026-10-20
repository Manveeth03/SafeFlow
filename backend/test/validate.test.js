import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, schemas } from '../src/lib/validate.js';

test('accepts a valid hazard and drops unknown fields', () => {
  const out = validate(schemas.hazard, { title: ' Leak ', severity: 3, likelihood: 2, riskScore: 99, admin: true });
  assert.deepEqual(out, { title: 'Leak', severity: 3, likelihood: 2 });
});

test('rejects missing required and out-of-range values', () => {
  assert.throws(() => validate(schemas.hazard, { severity: 9, likelihood: 2 }), (e) => e.status === 400 && e.details.length === 2);
});

test('rejects invalid enum values', () => {
  assert.throws(() => validate(schemas.task, { title: 'x', status: 'Blocked' }), (e) => e.status === 400);
});

test('partial updates do not require every field', () => {
  assert.deepEqual(validate(schemas.task, { status: 'Done' }, { partial: true }), { status: 'Done' });
});
