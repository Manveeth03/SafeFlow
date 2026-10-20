import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riskScore, riskLevel } from '../src/lib/risk.js';

test('risk score is severity x likelihood', () => {
  assert.equal(riskScore(4, 5), 20);
  assert.equal(riskScore(1, 1), 1);
});

test('risk level boundaries', () => {
  const cases = [[1, 'Low'], [4, 'Low'], [5, 'Medium'], [9, 'Medium'], [10, 'High'], [16, 'High'], [17, 'Critical'], [25, 'Critical']];
  for (const [score, level] of cases) assert.equal(riskLevel(score), level, `score ${score}`);
});

test('risk level rejects out-of-range scores', () => {
  assert.throws(() => riskLevel(0), RangeError);
  assert.throws(() => riskLevel(26), RangeError);
});
