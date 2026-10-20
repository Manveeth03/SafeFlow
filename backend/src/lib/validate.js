import { HttpError } from './errors.js';
import { PRIORITIES, REQ_STATUSES, VERIFICATIONS, HAZARD_STATUSES, TASK_STATUSES } from './constants.js';

const str = (max, required = false) => ({ type: 'string', max, required });
const oneOf = (values, required = false) => ({ type: 'enum', values, required });
const int = (min, max, required = false) => ({ type: 'int', min, max, required });

export const schemas = {
  requirement: {
    title: str(140, true),
    description: str(1000),
    priority: oneOf(PRIORITIES),
    status: oneOf(REQ_STATUSES),
    verification: oneOf(VERIFICATIONS),
    verificationRequired: { type: 'bool' },
  },
  hazard: {
    title: str(140, true),
    description: str(1000),
    mitigation: str(1000),
    severity: int(1, 5, true),
    likelihood: int(1, 5, true),
    status: oneOf(HAZARD_STATUSES),
  },
  task: {
    title: str(140, true),
    description: str(1000),
    priority: oneOf(PRIORITIES),
    status: oneOf(TASK_STATUSES),
  },
};

/** Whitelists fields, checks types and limits. Unknown keys are dropped. */
export function validate(schema, body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const out = {};
  const errors = [];
  for (const [key, rule] of Object.entries(schema)) {
    const v = body[key];
    if (v === undefined || v === null) {
      if (rule.required && !partial) errors.push(`${key} is required`);
      continue;
    }
    if (rule.type === 'string') {
      if (typeof v !== 'string') errors.push(`${key} must be text`);
      else if (rule.required && !v.trim()) errors.push(`${key} is required`);
      else if (v.length > rule.max) errors.push(`${key} must be at most ${rule.max} characters`);
      else out[key] = v.trim();
    } else if (rule.type === 'enum') {
      if (!rule.values.includes(v)) errors.push(`${key} must be one of: ${rule.values.join(', ')}`);
      else out[key] = v;
    } else if (rule.type === 'int') {
      if (!Number.isInteger(v) || v < rule.min || v > rule.max) {
        errors.push(`${key} must be a whole number from ${rule.min} to ${rule.max}`);
      } else out[key] = v;
    } else if (rule.type === 'bool') {
      if (typeof v !== 'boolean') errors.push(`${key} must be true or false`);
      else out[key] = v;
    }
  }
  if (errors.length) throw new HttpError(400, 'Validation failed', errors);
  return out;
}
