const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// ─── Exercise Database ───

const exercises = {
  chest: [
    { name: 'Bench Press', type: 'compound', equipment: 'barbell', difficulty: [1,5] },
    { name: 'Incline Dumbbell Press', type: 'compound', equipment: 'dumbbell', difficulty: [1,5] },
    { name: 'Dumbbell Fly', type: 'isolation', equipment: 'dumbbell', difficulty: [1,4] },
    { name: 'Push-Ups', type: 'compound', equipment: 'bodyweight', difficulty: [1,3] },
    { name: 'Cable Crossover', type: 'isolation', equipment: 'cable', difficulty: [2,5] },
    { name: 'Dips', type: 'compound', equipment: 'bodyweight', difficulty: [2,5] },
    { name: 'Machine Chest Press', type: 'compound', equipment: 'machine', difficulty: [1,3] },
  ],
  back: [
    { name: 'Pull-Ups', type: 'compound', equipment: 'bodyweight', difficulty: [3,5] },
    { name: 'Barbell Row', type: 'compound', equipment: 'barbell', difficulty: [2,5] },
    { name: 'Lat Pulldown', type: 'compound', equipment: 'cable', difficulty: [1,4] },
    { name: 'Seated Cable Row', type: 'compound', equipment: 'cable', difficulty: [1,4] },
    { name: 'Dumbbell Row', type: 'compound', equipment: 'dumbbell', difficulty: [1,5] },
    { name: 'Face Pull', type: 'isolation', equipment: 'cable', difficulty: [1,3] },
    { name: 'Hyperextension', type: 'isolation', equipment: 'bodyweight', difficulty: [1,3] },
  ],
  shoulders: [
    { name: 'Overhead Press', type: 'compound', equipment: 'barbell', difficulty: [2,5] },
    { name: 'Lateral Raise', type: 'isolation', equipment: 'dumbbell', difficulty: [1,4] },
    { name: 'Front Raise', type: 'isolation', equipment: 'dumbbell', difficulty: [1,3] },
    { name: 'Arnold Press', type: 'compound', equipment: 'dumbbell', difficulty: [2,5] },
    { name: 'Reverse Fly', type: 'isolation', equipment: 'dumbbell', difficulty: [1,4] },
    { name: 'Shrugs', type: 'isolation', equipment: 'barbell', difficulty: [1,3] },
  ],
  legs: [
    { name: 'Back Squat', type: 'compound', equipment: 'barbell', difficulty: [2,5] },
    { name: 'Front Squat', type: 'compound', equipment: 'barbell', difficulty: [3,5] },
    { name: 'Romanian Deadlift', type: 'compound', equipment: 'barbell', difficulty: [2,5] },
    { name: 'Leg Press', type: 'compound', equipment: 'machine', difficulty: [1,4] },
    { name: 'Bulgarian Split Squat', type: 'compound', equipment: 'dumbbell', difficulty: [2,5] },
    { name: 'Leg Extension', type: 'isolation', equipment: 'machine', difficulty: [1,3] },
    { name: 'Leg Curl', type: 'isolation', equipment: 'machine', difficulty: [1,3] },
    { name: 'Calf Raise', type: 'isolation', equipment: 'machine', difficulty: [1,2] },
    { name: 'Walking Lunges', type: 'compound', equipment: 'dumbbell', difficulty: [2,4] },
    { name: 'Box Jump', type: 'compound', equipment: 'bodyweight', difficulty: [2,4] },
  ],
  core: [
    { name: 'Plank', type: 'isolation', equipment: 'bodyweight', difficulty: [1,5] },
    { name: 'Hanging Leg Raise', type: 'isolation', equipment: 'bodyweight', difficulty: [3,5] },
    { name: 'Ab Wheel Rollout', type: 'isolation', equipment: 'bodyweight', difficulty: [3,5] },
    { name: 'Russian Twist', type: 'isolation', equipment: 'bodyweight', difficulty: [1,4] },
    { name: 'Bicycle Crunch', type: 'isolation', equipment: 'bodyweight', difficulty: [1,3] },
    { name: 'Mountain Climber', type: 'isolation', equipment: 'bodyweight', difficulty: [1,4] },
    { name: 'Dead Bug', type: 'isolation', equipment: 'bodyweight', difficulty: [1,3] },
  ],
  arms: [
    { name: 'Barbell Curl', type: 'isolation', equipment: 'barbell', difficulty: [1,4] },
    { name: 'Hammer Curl', type: 'isolation', equipment: 'dumbbell', difficulty: [1,4] },
    { name: 'Tricep Pushdown', type: 'isolation', equipment: 'cable', difficulty: [1,3] },
    { name: 'Skull Crusher', type: 'isolation', equipment: 'barbell', difficulty: [2,5] },
    { name: 'Overhead Tricep Extension', type: 'isolation', equipment: 'dumbbell', difficulty: [1,4] },
    { name: 'Preacher Curl', type: 'isolation', equipment: 'barbell', difficulty: [2,5] },
    { name: 'Close-Grip Bench Press', type: 'compound', equipment: 'barbell', difficulty: [2,5] },
  ],
};

// ─── Workout Templates ───

const workoutTypes = {
  fullBody: {
    name: 'Full Body',
    emoji: '💪',
    structure: [
      { group: 'legs', count: 1, compoundOnly: true },
      { group: 'chest', count: 1, compoundOnly: true },
      { group: 'back', count: 1, compoundOnly: true },
      { group: 'shoulders', count: 1 },
      { group: 'core', count: 1 },
    ],
  },
  upperBody: {
    name: 'Upper Body',
    emoji: '💪',
    structure: [
      { group: 'chest', count: 2, compoundOnly: true, max: 1 },
      { group: 'back', count: 2, compoundOnly: true, max: 1 },
      { group: 'shoulders', count: 2 },
      { group: 'arms', count: 2 },
    ],
  },
  lowerBody: {
    name: 'Lower Body',
    emoji: '🦵',
    structure: [
      { group: 'legs', count: 4, max: 2 },
      { group: 'core', count: 2 },
    ],
  },
  push: {
    name: 'Push',
    emoji: '🏋️',
    structure: [
      { group: 'chest', count: 3, max: 1 },
      { group: 'shoulders', count: 2 },
      { group: 'arms', count: 2, max: 1 },
    ],
  },
  pull: {
    name: 'Pull',
    emoji: '🏋️',
    structure: [
      { group: 'back', count: 3, max: 1 },
      { group: 'shoulders', count: 2, max: 1 },
      { group: 'arms', count: 2 },
    ],
  },
  hiit: {
    name: 'HIIT',
    emoji: '🔥',
    structure: [
      { group: 'legs', count: 2 },
      { group: 'chest', count: 2 },
      { group: 'core', count: 2 },
      { group: 'back', count: 1 },
      { group: 'shoulders', count: 1 },
    ],
  },
};

const difficultyLevels = {
  beginner: { name: 'Beginner', sets: [2, 3], reps: [8, 12], rest: 90, intensity: 'light' },
  intermediate: { name: 'Intermediate', sets: [3, 4], reps: [8, 12], rest: 75, intensity: 'moderate' },
  advanced: { name: 'Advanced', sets: [4, 5], reps: [6, 12], rest: 60, intensity: 'heavy' },
};

// ─── Generator Helpers ───

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickExercises(group, count, opts = {}, difficulty = 'intermediate') {
  const pool = exercises[group].filter(e => {
    if (opts.compoundOnly && e.type !== 'compound') return false;
    const [minD, maxD] = e.difficulty;
    const diffIdx = { beginner: 1, intermediate: 3, advanced: 5 }[difficulty];
    return minD <= diffIdx;
  });
  return shuffle(pool).slice(0, count);
}

function formatRest(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

// ─── Generate WoD ───

function generateWoD(type = 'fullBody', difficulty = 'intermediate') {
  const template = workoutTypes[type];
  const diffConfig = difficultyLevels[difficulty];
  const blocks = [];
  let totalEstimatedMin = 0;

  for (const slot of template.structure) {
    const count = slot.count || 1;
    const picked = pickExercises(slot.group, count, slot, difficulty);

    for (const exercise of picked) {
      const sets = rand(diffConfig.sets[0], diffConfig.sets[1]);
      const isTimeBased = type === 'hiit';
      let reps, rest, duration;

      if (isTimeBased) {
        duration = rand(30, 60); // seconds per set
        rest = rand(15, 30);
        reps = null;
      } else {
        reps = rand(diffConfig.reps[0], diffConfig.reps[1]);
        rest = diffConfig.rest;
        duration = null;
      }

      // Adjust rest for compound vs isolation
      if (!isTimeBased) {
        rest = exercise.type === 'compound' ? rest + 15 : rest - 15;
        rest = Math.max(rest, 30);
      }

      blocks.push({
        exercise: exercise.name,
        group: slot.group,
        type: exercise.type,
        equipment: exercise.equipment,
        sets,
        reps,
        duration,
        restSeconds: rest,
        restDisplay: formatRest(rest),
      });

      // Estimate time: sets * (reps*3s or duration) + sets * restSeconds
      const setTime = isTimeBased ? duration : (reps * 3);
      totalEstimatedMin += (setTime * sets + rest * (sets - 1)) / 60;
    }
  }

  // Generate a fun workout name
  const adjectives = ['Brutal', 'Savage', 'Iron', 'Thunder', 'Blaze', 'Storm', 'Fury', 'Titan', 'Apex', 'Alpha'];
  const nouns = ['Crusher', 'Forge', 'Blitz', 'Surge', 'Force', 'Impact', 'Engine', 'Protocol', 'Grid', 'Stack'];
  const workoutName = `${pick(adjectives)} ${pick(nouns)}`;

  return {
    name: workoutName,
    type: template.name,
    typeKey: type,
    emoji: template.emoji,
    difficulty: diffConfig.name,
    difficultyKey: difficulty,
    estimatedMinutes: Math.round(totalEstimatedMin),
    totalExercises: blocks.length,
    totalSets: blocks.reduce((s, b) => s + b.sets, 0),
    blocks,
  };
}

// ─── Routes ───

app.get('/api/types', (req, res) => {
  const types = Object.entries(workoutTypes).map(([key, val]) => ({
    key,
    name: val.name,
    emoji: val.emoji,
  }));
  res.json(types);
});

app.get('/api/generate', (req, res) => {
  const type = req.query.type || 'fullBody';
  const difficulty = req.query.difficulty || 'intermediate';

  if (!workoutTypes[type]) {
    return res.status(400).json({ error: `Unknown workout type: ${type}` });
  }
  if (!difficultyLevels[difficulty]) {
    return res.status(400).json({ error: `Unknown difficulty: ${difficulty}` });
  }

  const wod = generateWoD(type, difficulty);
  res.json(wod);
});

app.listen(PORT, () => {
  console.log(`🏋️ WoD Generator running on http://localhost:${PORT}`);
});