import "dotenv/config"
import mongoose from 'mongoose';
import { Requirement, Hazard, Task, Activity } from './models.js';
import { riskScore, riskLevel } from './lib/risk.js';



const requirements = [
  ['REQ-001', 'Infusion rate accuracy within ±5%', 'High', 'Verified', 'Passed'],
  ['REQ-002', 'Occlusion alarm within 30 seconds', 'Critical', 'Implemented', 'Passed'],
  ['REQ-003', 'Free-flow protection on cassette removal', 'Critical', 'Implemented', 'Pending'],
  ['REQ-004', 'Drug library version check at startup', 'High', 'Approved', 'Pending'],
  ['REQ-005', 'Battery low warning at 20% capacity', 'Medium', 'Verified', 'Passed'],
  ['REQ-006', 'Audible alarm at or above 55 dB', 'Medium', 'Verified', 'Passed'],
  ['REQ-007', 'Event log retained for 90 days', 'Low', 'Draft', 'Pending'],
  ['REQ-008', 'Dose entry confirmation screen', 'High', 'Implemented', 'Failed'],
];

const hazards = [
  ['Free-flow when cassette is removed', 'Drug delivers unrestricted if the cassette is pulled mid-infusion.', 'Anti-free-flow clamp and cassette-detect interlock.', 5, 4, 'Mitigating'],
  ['Delayed occlusion alarm', 'Line blockage is not reported before pressure builds.', 'Pressure sensor sampling every 250 ms.', 4, 3, 'Mitigating'],
  ['Outdated drug library loaded', 'Dose limits come from a stale drug library.', 'Version check and lockout at startup.', 5, 2, 'Open'],
  ['Battery depletes without warning', 'Pump stops with no advance alert.', 'Low-battery warning and reserve capacity.', 3, 3, 'Open'],
  ['Display freezes during bolus', 'Clinician cannot see delivered volume.', 'Watchdog restarts the UI process.', 4, 2, 'Open'],
  ['Keypad bounce alters dose entry', 'Duplicate keypresses change the entered dose.', 'Debounce and confirmation screen.', 3, 4, 'Resolved'],
  ['Alarm too quiet in ward', 'Alarm is not heard at the nurses station.', 'Raised level to 55 dB and added pulse tone.', 2, 2, 'Resolved'],
];

const tasks = [
  ['Write verification test for REQ-003', 'High', 'In Progress'],
  ['Review free-flow hazard mitigation', 'Critical', 'To Do'],
  ['Fix dose confirmation failing test', 'High', 'To Do'],
  ['Update drug library loader', 'Medium', 'In Progress'],
  ['Draft event log retention design', 'Low', 'To Do'],
  ['Run occlusion alarm bench test', 'High', 'Done'],
  ['Calibrate flow rate sensor', 'Medium', 'Done'],
  ['Prepare design review pack', 'Medium', 'Done'],
];

await mongoose.connect(process.env.MONGO_URI);

// Upserts keyed on a natural key with $setOnInsert: re-running never duplicates or overwrites edits.
await Requirement.bulkWrite(requirements.map(([reqId, title, priority, status, verification]) => ({
  updateOne: { filter: { reqId }, update: { $setOnInsert: { reqId, title, priority, status, verification, verificationRequired: true, description: '' } }, upsert: true },
})));

await Hazard.bulkWrite(hazards.map(([title, description, mitigation, severity, likelihood, status]) => {
  const score = riskScore(severity, likelihood);
  return {
    updateOne: {
      filter: { title },
      update: { $setOnInsert: { title, description, mitigation, severity, likelihood, status, riskScore: score, riskLevel: riskLevel(score), ...(status === 'Resolved' && { resolvedAt: new Date() }) } },
      upsert: true,
    },
  };
}));

await Task.bulkWrite(tasks.map(([title, priority, status]) => ({
  updateOne: { filter: { title }, update: { $setOnInsert: { title, priority, status, description: '' } }, upsert: true },
})));

if ((await Activity.countDocuments()) === 0) {
  await Activity.insertMany([
    { entity: 'Task', action: 'created', message: 'Task created: Prepare design review pack' },
    { entity: 'Hazard', action: 'resolved', message: 'Hazard resolved: Keypad bounce alters dose entry' },
    { entity: 'Requirement', action: 'updated', message: 'Requirement updated: REQ-002 Occlusion alarm within 30 seconds' },
    { entity: 'Hazard', action: 'created', message: 'Hazard created: Free-flow when cassette is removed' },
  ]);
}

console.log(`Seed complete: ${await Requirement.countDocuments()} requirements, ${await Hazard.countDocuments()} hazards, ${await Task.countDocuments()} tasks`);
await mongoose.disconnect();
