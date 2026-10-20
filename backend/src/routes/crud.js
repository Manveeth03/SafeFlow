import { Router } from 'express';
import mongoose from 'mongoose';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { logActivity } from '../models.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function findOr404(Model, label) {
  return async (id) => {
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, `${label} not found`);
    const doc = await Model.findById(id);
    if (!doc) throw new HttpError(404, `${label} not found`);
    return doc;
  };
}

/** Generic CRUD router. `filters` lists query params that map to exact-match fields. */
export function crud({ Model, schema, label, filters = [], sort = { createdAt: -1 }, beforeCreate, name }) {
  const router = Router();
  const find = findOr404(Model, label);
  const display = (doc) => name(doc);

  router.get('/', wrap(async (req, res) => {
    const query = {};
    for (const key of filters) {
      if (typeof req.query[key] === 'string' && req.query[key]) query[key] = req.query[key];
    }
    if (typeof req.query.q === 'string' && req.query.q) {
      query.title = { $regex: escapeRegex(req.query.q.slice(0, 100)), $options: 'i' };
    }
    res.json(await Model.find(query).sort(sort));
  }));

  router.get('/:id', wrap(async (req, res) => res.json(await find(req.params.id))));

  router.post('/', wrap(async (req, res) => {
    const data = validate(schema, req.body);
    if (beforeCreate) Object.assign(data, await beforeCreate(data));
    const doc = await Model.create(data);
    await logActivity(label, 'created', `${label} created: ${display(doc)}`);
    res.status(201).json(doc);
  }));

  router.put('/:id', wrap(async (req, res) => {
    const doc = await find(req.params.id);
    doc.set(validate(schema, req.body, { partial: true }));
    await doc.save();
    await logActivity(label, 'updated', `${label} updated: ${display(doc)}`);
    res.json(doc);
  }));

  router.delete('/:id', wrap(async (req, res) => {
    const doc = await find(req.params.id);
    await doc.deleteOne();
    await logActivity(label, 'deleted', `${label} deleted: ${display(doc)}`);
    res.status(204).end();
  }));

  return { router, find, wrap };
}
