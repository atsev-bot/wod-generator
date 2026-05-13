const $ = s => document.querySelector(s);

let currentType = 'fullBody';
let currentDifficulty = 'intermediate';

// Type buttons
document.querySelectorAll('[data-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
  });
});

// Difficulty buttons
document.querySelectorAll('[data-diff]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDifficulty = btn.dataset.diff;
  });
});

// Generate button
document.getElementById('generate-btn').addEventListener('click', generate);

async function generate() {
  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Generating...';

  try {
    const res = await fetch(`/api/generate?type=${currentType}&difficulty=${currentDifficulty}`);
    if (!res.ok) throw new Error('Generation failed');
    const wod = await res.json();
    renderWorkout(wod);
  } catch (err) {
    console.error(err);
    alert('Something went wrong. Try again!');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🏋️ Generate Workout';
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
    <div class="exercise-block" style="animation-delay: ${i * 0.05}s">
      <div class="ex-top">
        <span class="ex-name">${groupEmojis[b.group] || '💪'} ${b.exercise}</span>
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
  workoutEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}