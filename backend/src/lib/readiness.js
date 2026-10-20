import { riskScore, riskLevel } from './risk.js';

/**
 * Release readiness. Blocked when:
 *  - any unresolved hazard is Critical, or
 *  - any requirement that needs verification has not Passed.
 */
export function computeReadiness({ hazards = [], requirements = [] }) {
  const criticalOpen = hazards.filter((h) => {
    const score = h.riskScore ?? riskScore(h.severity, h.likelihood);
    return h.status !== 'Resolved' && riskLevel(score) === 'Critical';
  });
  const required = requirements.filter((r) => r.verificationRequired !== false);
  const passed = required.filter((r) => r.verification === 'Passed');
  const incomplete = required.length - passed.length;

  const blockers = [];
  if (criticalOpen.length > 0) {
    blockers.push({
      code: 'CRITICAL_HAZARDS',
      message: `${criticalOpen.length} unresolved critical hazard${criticalOpen.length > 1 ? 's' : ''}`,
      items: criticalOpen.map((h) => h.title),
    });
  }
  if (incomplete > 0) {
    blockers.push({
      code: 'VERIFICATION_INCOMPLETE',
      message: `${incomplete} of ${required.length} required verification${required.length > 1 ? 's' : ''} not passed`,
      items: required.filter((r) => r.verification !== 'Passed').map((r) => r.reqId || r.title),
    });
  }

  return {
    ready: blockers.length === 0,
    blockers,
    stats: {
      criticalOpen: criticalOpen.length,
      requiredVerifications: required.length,
      passedVerifications: passed.length,
      passRate: required.length ? Math.round((passed.length / required.length) * 100) : null,
    },
  };
}
