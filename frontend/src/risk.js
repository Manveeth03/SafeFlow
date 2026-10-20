// Mirrors backend/src/lib/risk.js so forms can preview the score before saving.
export const riskScore = (severity, likelihood) => Number(severity) * Number(likelihood);

export function riskLevel(score) {
  if (score <= 4) return 'Low';
  if (score <= 9) return 'Medium';
  if (score <= 16) return 'High';
  return 'Critical';
}
