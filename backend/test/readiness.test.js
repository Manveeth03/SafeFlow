import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeReadiness } from '../src/lib/readiness.js';

const req = (verification, extra = {}) => ({ reqId: 'REQ-X', verification, verificationRequired: true, ...extra });
const hazard = (severity, likelihood, status = 'Open') => ({ title: 'H', severity, likelihood, status });

test('ready when no critical hazards and all verification passed', () => {
  const r = computeReadiness({ hazards: [hazard(2, 2)], requirements: [req('Passed')] });
  assert.equal(r.ready, true);
  assert.equal(r.stats.passRate, 100);
});

test('blocked by an unresolved critical hazard', () => {
  const r = computeReadiness({ hazards: [hazard(5, 4)], requirements: [req('Passed')] });
  assert.equal(r.ready, false);
  assert.equal(r.blockers[0].code, 'CRITICAL_HAZARDS');
});

test('resolved critical hazard does not block', () => {
  const r = computeReadiness({ hazards: [hazard(5, 5, 'Resolved')], requirements: [req('Passed')] });
  assert.equal(r.ready, true);
});

test('blocked when required verification is incomplete', () => {
  const r = computeReadiness({ hazards: [], requirements: [req('Passed'), req('Pending'), req('Failed')] });
  assert.equal(r.ready, false);
  assert.equal(r.blockers[0].code, 'VERIFICATION_INCOMPLETE');
  assert.equal(r.stats.passRate, 33);
});

test('requirements that do not need verification are ignored', () => {
  const r = computeReadiness({ hazards: [], requirements: [req('Pending', { verificationRequired: false })] });
  assert.equal(r.ready, true);
  assert.equal(r.stats.passRate, null);
});
