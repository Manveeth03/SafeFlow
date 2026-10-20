import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riskScore, riskLevel } from './risk.js';

test('frontend risk preview matches the classification bands', () => {
  assert.equal(riskScore(4, 4), 16);
  assert.equal(riskLevel(4), 'Low');
  assert.equal(riskLevel(9), 'Medium');
  assert.equal(riskLevel(16), 'High');
  assert.equal(riskLevel(17), 'Critical');
});
