const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let currentType = 'fullBody';
let currentDifficulty = 'intermediate';
let currentWod = null;
let timerInterval = null;
let timerState = null;

// ─── Storage ───
function getHistory() {
  try { return JSON.parse(localStorage.getItem('wod_history') || '[]'); } catch { return []; }
}

function saveToHistory(wod) {
  const history = getHistory();
  const entry = {
    id: Date.now(),
    date: new Date().toISOString(),
    name: wod.name,
    type: wod.type,
    typeKey: wod.typeKey,
    emoji: wod.emoji,
    difficulty: wod.difficulty,
    difficultyKey: wod.difficultyKey,
    totalExercises: wod.totalExercises,
    totalSets: wod.totalSets,
    estimatedMinutes: wod.estimatedMinutes,
    blocks: wod.blocks,
  };
  history.unshift(entry);
  // Keep last 50
  if (history.length > 50) history.pop();
  localStorage.setItem('wod_history', JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem('wod_history');
}

// ─── Type / Difficulty buttons ───
$$('[data-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('[data-type]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
  });
});

$$('[data-diff]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('[data-diff]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDifficulty = btn.dataset.diff;
  });
});

// ─── Generate ───
document.getElementById('generate-btn').addEventListener('click', generate);

async function generate() {
  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  try {
    const res = await fetch(`/api/generate?type=${currentType}&difficulty=${currentDifficulty}`);
    if (!res.ok) throw new Error('Generation failed');
    const wod = await res.json();
    currentWod = wod;
    renderWorkout(wod);
    saveToHistory(wod);
    renderHistory();
  } catch (err) {
    console.error(err);
    alert('Something went wrong. Try again!');
  } finally {
    btn.disabled = false;
    btn.textContent = '🏋️ Generate Workout';
  }
}

const groupEmojis = {
  chest: '💙', back: '🟢', shoulders: '🟡',
  legs: '🔴', core: '🟠', arms: '💪',
};

const groupLabels = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  legs: 'Legs', core: 'Core', arms: 'Arms',
};

function renderWorkout(wod) {
  const workoutEl = document.getElementById('workout');
  const nameEl = document.getElementById('wod-name');
  const metaEl = document.getElementById('wod-meta');
  const listEl = document.getElementById('exercise-list');

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  nameEl.textContent = `${wod.emoji} ${wod.name}`;

  metaEl.innerHTML = `
    <span class="meta-item">📅 ${dateStr}</span>
    <span class="meta-item">🏷️ <strong>${wod.type}</strong></span>
    <span class="meta-item">⚡ <strong>${wod.difficulty}</strong></span>
    <span class="meta-item">🏋️ <strong>${wod.totalExercises}</strong> exercises</span>
    <span class="meta-item">📊 <strong>${wod.totalSets}</strong> sets</span>
    <span class="meta-item">⏱️ ~<strong>${wod.estimatedMinutes}</strong> min</span>
  `;

  listEl.innerHTML = wod.blocks.map((b, i) => `
    <div class="exercise-block" data-idx="${i}" id="ex-${i}">
      <div class="ex-top">
        <span class="ex-name">${groupEmojis[b.group] || '💪'} ${b.exercise} <span class="done-badge">✅ Done</span></span>
        <div class="ex-tags">
          <span class="tag tag-group">${groupLabels[b.group] || b.group}</span>
          <span class="tag tag-type">${b.type}</span>
          <span class="tag tag-equip">${b.equipment}</span>
        </div>
      </div>
      <div class="ex-details">
        <span class="ex-stat"><span class="label">Sets</span> <span class="value">${b.sets}</span></span>
        ${b.reps ? `<span class="ex-stat"><span class="label">Reps</span> <span class="value">${b.reps}</span></span>` : ''}
        ${b.duration ? `<span class="ex-stat"><span class="label">Work</span> <span class="value">${b.duration}s</span></span>` : ''}
        <span class="ex-stat rest"><span class="label">Rest</span> <span class="value">${b.restDisplay}</span></span>
      </div>
    </div>
  `).join('');

  workoutEl.classList.add('active');
  document.getElementById('action-bar').style.display = 'flex';
  workoutEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Timer ───
document.getElementById('btn-timer').addEventListener('click', startTimer);
document.getElementById('btn-history').addEventListener('click', toggleHistory);
document.getElementById('btn-clear-history').addEventListener('click', () => {
  if (confirm('Clear all workout history?')) {
    clearHistory();
    renderHistory();
  }
});

function startTimer() {
  if (!currentWod) return;

  // Build flat step list: for each exercise, sets × (work + rest), last set has no rest
  const steps = [];
  currentWod.blocks.forEach((block, exIdx) => {
    const workSeconds = block.duration || (block.reps * 4); // estimate 4s per rep for non-HIIT
    for (let set = 1; set <= block.sets; set++) {
      steps.push({
        type: 'work',
        exercise: block.exercise,
        group: block.group,
        setNum: set,
        totalSets: block.sets,
        seconds: workSeconds,
        reps: block.reps || null,
        duration: block.duration || null,
        exIdx,
      });
      if (set < block.sets) {
        steps.push({
          type: 'rest',
          exercise: block.exercise,
          group: block.group,
          setNum: set,
          totalSets: block.sets,
          seconds: block.restSeconds,
          exIdx,
        });
      }
    }
  });

  // 5s get-ready
  steps.unshift({
    type: 'get-ready',
    exercise: 'Get Ready!',
    seconds: 5,
    group: '',
    setNum: 0,
    totalSets: 0,
    exIdx: -1,
  });

  timerState = {
    steps,
    currentStep: 0,
    timeLeft: steps[0].seconds,
    paused: false,
    finished: false,
  };

  // Reset exercise highlights
  $$('.exercise-block').forEach(el => {
    el.classList.remove('active-ex', 'done-ex');
  });
  // Show exercise list behind overlay
  renderTimerStep();
  document.getElementById('timer-overlay').classList.add('active');

  // Button handlers
  document.getElementById('timer-pause').onclick = togglePause;
  document.getElementById('timer-skip').onclick = skipStep;
  document.getElementById('timer-quit').onclick = quitTimer;
  document.getElementById('timer-restart').onclick = () => {
    document.getElementById('timer-restart').style.display = 'none';
    startTimer();
  };

  runTimer();
}

function runTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (timerState.paused || timerState.finished) return;

    timerState.timeLeft--;

    if (timerState.timeLeft < 0) {
      // Next step
      timerState.currentStep++;
      if (timerState.currentStep >= timerState.steps.length) {
        finishTimer();
        return;
      }
      timerState.timeLeft = timerState.steps[timerState.currentStep].seconds;
    }

    renderTimerStep();
  }, 1000);

  renderTimerStep();
}

function renderTimerStep() {
  const step = timerState.steps[timerState.currentStep];
  const overlay = document.getElementById('timer-overlay');
  const countdown = document.getElementById('timer-countdown');
  const phaseLabel = document.getElementById('timer-phase');
  const exerciseLabel = document.getElementById('timer-exercise');
  const setInfo = document.getElementById('timer-set-info');
  const progressBar = document.getElementById('timer-progress-bar');
  const pauseBtn = document.getElementById('timer-pause');
  const summary = document.getElementById('timer-summary');

  // Phase styling
  const phaseText = {
    'work': 'WORK',
    'rest': 'REST',
    'get-ready': 'GET READY',
  }[step.type] || '';
  phaseLabel.textContent = phaseText;

  countdown.className = 'timer-countdown ' + (step.type === 'get-ready' ? 'get-ready' : step.type);
  progressBar.className = 'timer-progress-bar ' + (step.type === 'get-ready' ? 'get-ready' : step.type);

  // Highlight current exercise in list
  $$('.exercise-block').forEach(el => {
    const idx = parseInt(el.dataset.idx);
    if (idx === step.exIdx) {
      el.classList.add('active-ex');
      el.classList.remove('done-ex');
    } else if (idx < step.exIdx) {
      el.classList.add('done-ex');
      el.classList.remove('active-ex');
    } else {
      el.classList.remove('active-ex', 'done-ex');
    }
  });

  exerciseLabel.textContent = step.exercise;

  if (step.totalSets > 0) {
    setInfo.textContent = `Set ${step.setNum} of ${step.totalSets}${step.reps ? ` · ${step.reps} reps` : ''}${step.duration ? ` · ${step.duration}s work` : ''}`;
  } else {
    setInfo.textContent = '';
  }

  // Countdown display
  const mins = Math.floor(timerState.timeLeft / 60);
  const secs = timerState.timeLeft % 60;
  countdown.textContent = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}`;

  // Progress bar
  const total = step.seconds;
  const elapsed = total - timerState.timeLeft;
  const pct = total > 0 ? (elapsed / total) * 100 : 0;
  progressBar.style.width = pct + '%';

  // Pause button
  pauseBtn.textContent = timerState.paused ? '▶ Resume' : '⏸ Pause';

  // Summary
  const idx = timerState.currentStep;
  const total = timerState.steps.length;
  summary.textContent = `Step ${idx + 1} of ${total} · ${timerState.paused ? 'Paused' : 'Running'}`;
}

function togglePause() {
  timerState.paused = !timerState.paused;
  renderTimerStep();
}

function skipStep() {
  timerState.currentStep++;
  if (timerState.currentStep >= timerState.steps.length) {
    finishTimer();
    return;
  }
  timerState.timeLeft = timerState.steps[timerState.currentStep].seconds;
  renderTimerStep();
}

function finishTimer() {
  timerState.finished = true;
  clearInterval(timerInterval);
  timerInterval = null;

  const countdown = document.getElementById('timer-countdown');
  const phaseLabel = document.getElementById('timer-phase');
  const exerciseLabel = document.getElementById('timer-exercise');
  const setInfo = document.getElementById('timer-set-info');
  const progressBar = document.getElementById('timer-progress-bar');
  const pauseBtn = document.getElementById('timer-pause');
  const skipBtn = document.getElementById('timer-skip');
  const summary = document.getElementById('timer-summary');
  const restartBtn = document.getElementById('timer-restart');

  countdown.textContent = '🎉';
  countdown.className = 'timer-countdown work';
  phaseLabel.textContent = 'WORKOUT COMPLETE';
  exerciseLabel.textContent = currentWod.emoji + ' ' + currentWod.name;
  setInfo.textContent = `${currentWod.totalExercises} exercises · ${currentWod.totalSets} sets · ~${currentWod.estimatedMinutes} min`;
  progressBar.style.width = '100%';
  progressBar.className = 'timer-progress-bar work';
  pauseBtn.style.display = 'none';
  skipBtn.style.display = 'none';
  summary.textContent = 'Great job! 💪';
  restartBtn.style.display = 'inline-flex';

  // Mark all exercises done
  $$('.exercise-block').forEach(el => {
    el.classList.remove('active-ex');
    el.classList.add('done-ex');
  });
}

function quitTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerState = null;
  document.getElementById('timer-overlay').classList.remove('active');
  // Reset button visibility
  document.getElementById('timer-pause').style.display = '';
  document.getElementById('timer-skip').style.display = '';
  document.getElementById('timer-restart').style.display = 'none';
  $$('.exercise-block').forEach(el => {
    el.classList.remove('active-ex', 'done-ex');
  });
}

// ─── History ───
function toggleHistory() {
  const section = document.getElementById('history-section');
  const isHidden = !section.classList.contains('active');
  section.classList.toggle('active');
  if (isHidden) {
    renderHistory();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderHistory() {
  const history = getHistory();
  const listEl = document.getElementById('history-list');
  const clearBtn = document.getElementById('btn-clear-history');

  if (history.length === 0) {
    listEl.innerHTML = '<div class="history-empty">No workouts yet. Generate your first one! 💪</div>';
    clearBtn.style.display = 'none';
    return;
  }

  clearBtn.style.display = '';
  listEl.innerHTML = history.map(h => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item" data-id="${h.id}">
        <div class="hi-top">
          <span class="hi-name">${h.emoji || '🏋️'} ${h.name}</span>
          <span class="hi-date">${dateStr}</span>
        </div>
        <div class="hi-stats">
          <span>🏷️ ${h.type}</span>
          <span>⚡ ${h.difficulty}</span>
          <span>🏋️ ${h.totalExercises} exercises</span>
          <span>⏱️ ~${h.estimatedMinutes} min</span>
        </div>
      </div>
    `;
  }).join('');
}

// Click history item to re-render that workout
document.getElementById('history-list').addEventListener('click', e => {
  const item = e.target.closest('.history-item');
  if (!item) return;
  const id = parseInt(item.dataset.id);
  const history = getHistory();
  const entry = history.find(h => h.id === id);
  if (entry) {
    currentWod = entry;
    // Re-render the workout using the stored blocks
    const wod = { ...entry, blocks: entry.blocks };
    renderWorkout(wod);
    document.getElementById('workout').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Init: render history on load
renderHistory();