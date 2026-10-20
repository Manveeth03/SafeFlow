import { Router } from 'express';
import mongoose from 'mongoose';
import { crud } from './crud.js';
import { schemas } from '../lib/validate.js';
import { computeReadiness } from '../lib/readiness.js';
import { Requirement, Hazard, Task, Activity, logActivity } from '../models.js';

const api = Router();

api.get('/health', (_req, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', database: db ? 'connected' : 'disconnected' });
});

const requirements = crud({
  Model: Requirement,
  schema: schemas.requirement,
  label: 'Requirement',
  filters: ['status', 'priority', 'verification'],
  sort: { reqId: 1 },
  name: (d) => `${d.reqId} ${d.title}`,
  beforeCreate: async () => {
    const last = await Requirement.findOne().sort({ reqId: -1 }).select('reqId');
    const next = last ? Number.parseInt(last.reqId.split('-')[1], 10) + 1 : 1;
    return { reqId: `REQ-${String(next).padStart(3, '0')}` };
  },
});
api.use('/requirements', requirements.router);

const hazards = crud({
  Model: Hazard,
  schema: schemas.hazard,
  label: 'Hazard',
  filters: ['status', 'riskLevel'],
  sort: { riskScore: -1, createdAt: -1 },
  name: (d) => d.title,
});
hazards.router.patch('/:id/resolve', hazards.wrap(async (req, res) => {
  const hazard = await hazards.find(req.params.id);
  hazard.status = 'Resolved';
  await hazard.save();
  await logActivity('Hazard', 'resolved', `Hazard resolved: ${hazard.title}`);
  res.json(hazard);
}));
api.use('/hazards', hazards.router);

const tasks = crud({
  Model: Task,
  schema: schemas.task,
  label: 'Task',
  filters: ['status', 'priority'],
  name: (d) => d.title,
});
api.use('/tasks', tasks.router);

async function readiness() {
  const [hz, rq] = await Promise.all([Hazard.find().lean(), Requirement.find().lean()]);
  return computeReadiness({ hazards: hz, requirements: rq });
}

api.get('/readiness', async (_req, res, next) => {
  try { res.json(await readiness()); } catch (err) { next(err); }
});

api.get('/dashboard', async (_req, res, next) => {
  try {
    const [totalRequirements, openHazards, hazardsByLevel, totalTasks, completedTasks, activity, ready] =
      await Promise.all([
        Requirement.countDocuments(),
        Hazard.countDocuments({ status: { $ne: 'Resolved' } }),
        Hazard.aggregate([{ $match: { status: { $ne: 'Resolved' } } }, { $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
        Task.countDocuments(),
        Task.countDocuments({ status: 'Done' }),
        Activity.find().sort({ createdAt: -1 }).limit(8).lean(),
        readiness(),
      ]);
    const counts = Object.fromEntries(hazardsByLevel.map((r) => [r._id, r.count]));
    res.json({
      totalRequirements,
      openHazards,
      totalTasks,
      completedTasks,
      passRate: ready.stats.passRate,
      riskDistribution: ['Low', 'Medium', 'High', 'Critical'].map((level) => ({ level, count: counts[level] || 0 })),
      recentActivity: activity,
      readiness: ready,
    });
  } catch (err) { next(err); }
});

export default api;
