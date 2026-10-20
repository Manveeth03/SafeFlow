/** Risk score = severity x likelihood (both 1-5). */
export function riskScore(severity, likelihood) {
  return Number(severity) * Number(likelihood);
}

/** 1-4 Low, 5-9 Medium, 10-16 High, 17-25 Critical. */
export function riskLevel(score) {
  if (!Number.isFinite(score) || score < 1 || score > 25) {
    throw new RangeError('Risk score must be between 1 and 25');
  }
  if (score <= 4) return 'Low';
  if (score <= 9) return 'Medium';
  if (score <= 16) return 'High';
  return 'Critical';
}
