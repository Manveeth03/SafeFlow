import mongoose from 'mongoose';
import { PRIORITIES, REQ_STATUSES, VERIFICATIONS, HAZARD_STATUSES, TASK_STATUSES, RISK_LEVELS } from './lib/constants.js';
import { riskScore, riskLevel } from './lib/risk.js';

const opts = { timestamps: true };

const requirementSchema = new mongoose.Schema(
  {
    reqId: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', maxlength: 1000 },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: REQ_STATUSES, default: 'Draft' },
    verification: { type: String, enum: VERIFICATIONS, default: 'Pending' },
    verificationRequired: { type: Boolean, default: true },
  },
  opts,
);

const hazardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140, unique: true },
    description: { type: String, default: '', maxlength: 1000 },
    mitigation: { type: String, default: '', maxlength: 1000 },
    severity: { type: Number, required: true, min: 1, max: 5 },
    likelihood: { type: Number, required: true, min: 1, max: 5 },
    riskScore: { type: Number, min: 1, max: 25 },
    riskLevel: { type: String, enum: RISK_LEVELS },
    status: { type: String, enum: HAZARD_STATUSES, default: 'Open' },
    resolvedAt: Date,
  },
  opts,
);

hazardSchema.pre('validate', function computeRisk() {
  this.riskScore = riskScore(this.severity, this.likelihood);
  this.riskLevel = riskLevel(this.riskScore);
  if (this.status === 'Resolved' && !this.resolvedAt) this.resolvedAt = new Date();
  if (this.status !== 'Resolved') this.resolvedAt = undefined;
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140, unique: true },
    description: { type: String, default: '', maxlength: 1000 },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: TASK_STATUSES, default: 'To Do' },
  },
  opts,
);

const activitySchema = new mongoose.Schema(
  {
    entity: { type: String, required: true },
    action: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Requirement = mongoose.model('Requirement', requirementSchema);
export const Hazard = mongoose.model('Hazard', hazardSchema);
export const Task = mongoose.model('Task', taskSchema);
export const Activity = mongoose.model('Activity', activitySchema);

export async function logActivity(entity, action, message) {
  try {
    await Activity.create({ entity, action, message });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
}
