// Olympic Barbell Plate Calculator & 1RM Estimator (LBS & KG)

const PLATES_CONFIG_LBS = [
  { weight: 45, color: '#3b82f6', name: 'Blue (45 lb)', height: 140, width: 22, text: '#ffffff' },
  { weight: 35, color: '#eab308', name: 'Yellow (35 lb)', height: 140, width: 20, text: '#000000' },
  { weight: 25, color: '#22c55e', name: 'Green (25 lb)', height: 140, width: 18, text: '#ffffff' },
  { weight: 10, color: '#18181b', name: 'Black (10 lb)', height: 140, width: 14, text: '#ffffff' },
  { weight: 5, color: '#f4f4f5', name: 'White (5 lb)', height: 85, width: 14, text: '#000000' },
  { weight: 2.5, color: '#27272a', name: 'Black (2.5 lb)', height: 75, width: 12, text: '#ffffff' },
  { weight: 1.25, color: '#71717a', name: 'Metal (1.25 lb)', height: 65, width: 10, text: '#ffffff' }
];

const PLATES_CONFIG_KG = [
  { weight: 25, color: '#ef4444', name: 'Red (25 kg)', height: 140, width: 22, text: '#ffffff' },
  { weight: 20, color: '#3b82f6', name: 'Blue (20 kg)', height: 140, width: 20, text: '#ffffff' },
  { weight: 15, color: '#eab308', name: 'Yellow (15 kg)', height: 140, width: 18, text: '#000000' },
  { weight: 10, color: '#22c55e', name: 'Green (10 kg)', height: 140, width: 16, text: '#ffffff' },
  { weight: 5, color: '#f4f4f5', name: 'White (5 kg)', height: 85, width: 14, text: '#000000' },
  { weight: 2.5, color: '#27272a', name: 'Black (2.5 kg)', height: 75, width: 12, text: '#ffffff' },
  { weight: 1.25, color: '#71717a', name: 'Silver (1.25 kg)', height: 65, width: 10, text: '#ffffff' },
  { weight: 0.5, color: '#a855f7', name: 'Purple (0.5 kg)', height: 55, width: 8, text: '#ffffff' }
];

let state = {
  unit: 'lbs',
  targetWeight: 225,
  barWeight: 45,
  collarsWeight: 0,
  rmWeight: 185,
  rmReps: 5
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function getPlatesConfig() {
  return state.unit === 'lbs' ? PLATES_CONFIG_LBS : PLATES_CONFIG_KG;
}

function calculatePlates(target, bar, collars) {
  const tare = bar + collars;
  let remainingPerSide = Math.max(0, (target - tare) / 2);

  const loadedPlates = [];
  const plateCounts = {};

  const config = getPlatesConfig();

  config.forEach(p => {
    let count = 0;
    while (remainingPerSide >= p.weight - 0.001) {
      loadedPlates.push(p);
      count++;
      remainingPerSide -= p.weight;
      remainingPerSide = Math.round(remainingPerSide * 1000) / 1000;
    }
    if (count > 0) {
      plateCounts[p.weight] = count;
    }
  });

  const weightPerSide = loadedPlates.reduce((acc, p) => acc + p.weight, 0);
  const actualTotal = tare + weightPerSide * 2;
  const difference = target - actualTotal;

  return { tare, weightPerSide, actualTotal, difference, loadedPlates, plateCounts };
}

function calculate1RM(weight, reps) {
  const w = parseFloat(weight) || 0;
  const r = parseInt(reps, 10) || 1;
  if (r <= 1) return w;
  const epley = w * (1 + r / 30);
  const brzycki = r < 37 ? w * (36 / (37 - r)) : epley;
  return Math.round(((epley + brzycki) / 2) * 2) / 2;
}

function renderBarVisual(loadedPlates) {
  const sleeve = $('#bar-sleeve');
  sleeve.innerHTML = '';

  if (loadedPlates.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-sleeve-msg';
    emptyMsg.textContent = 'Empty Barbell';
    sleeve.appendChild(emptyMsg);
    return;
  }

  loadedPlates.forEach((plate, i) => {
    const plateEl = document.createElement('div');
    plateEl.className = 'visual-plate';
    plateEl.style.backgroundColor = plate.color;
    plateEl.style.height = `${plate.height}px`;
    plateEl.style.width = `${plate.width}px`;
    plateEl.style.color = plate.text;
    plateEl.title = `${plate.weight} ${state.unit}`;

    const label = document.createElement('span');
    label.className = 'plate-label';
    label.textContent = plate.weight;
    plateEl.appendChild(label);

    sleeve.appendChild(plateEl);
  });
}

function renderPlatePills(plateCounts) {
  const container = $('#plate-pills');
  container.innerHTML = '';

  const entries = Object.entries(plateCounts).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
  if (entries.length === 0) {
    container.innerHTML = `<span class="pill-empty">No plates needed (lift the bare bar)</span>`;
    return;
  }

  entries.forEach(([weight, count]) => {
    const pill = document.createElement('span');
    pill.className = 'plate-pill';
    pill.innerHTML = `<strong>${count}x</strong> ${weight} ${state.unit}`;
    container.appendChild(pill);
  });
}

function renderWarmupTable(target) {
  const tbody = $('#warmup-tbody');
  tbody.innerHTML = '';

  const percentages = [
    { name: 'Bar Only', pct: 0, reps: '10' },
    { name: 'Warm-up 1', pct: 0.45, reps: '5' },
    { name: 'Warm-up 2', pct: 0.65, reps: '3' },
    { name: 'Warm-up 3', pct: 0.85, reps: '2' },
    { name: 'Working Set', pct: 1.0, reps: 'Target' }
  ];

  percentages.forEach(p => {
    const setWeight = p.pct === 0 ? state.barWeight : Math.max(state.barWeight, Math.round((target * p.pct) / 5) * 5);
    const math = calculatePlates(setWeight, state.barWeight, state.collarsWeight);
    const plateSummary = Object.entries(math.plateCounts).map(([w, c]) => `${c}x${w}`).join(', ') || 'Bare bar';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td>${p.pct === 0 ? '0%' : Math.round(p.pct * 100) + '%'}</td>
      <td><span class="table-weight">${math.actualTotal} ${state.unit}</span></td>
      <td>${plateSummary}</td>
      <td><span class="table-reps">${p.reps}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function render() {
  const math = calculatePlates(state.targetWeight, state.barWeight, state.collarsWeight);

  // Update text values
  $('#display-unit').textContent = state.unit;
  $('#val-per-side').textContent = `${math.weightPerSide} ${state.unit}`;
  $('#val-actual-total').textContent = `${math.actualTotal} ${state.unit}`;
  $('#val-diff').textContent = `${math.difference > 0 ? '+' : ''}${math.difference} ${state.unit}`;
  $('#tare-badge').textContent = `Bar: ${state.barWeight} ${state.unit} · Collars: ${state.collarsWeight} ${state.unit}`;

  renderBarVisual(math.loadedPlates);
  renderPlatePills(math.plateCounts);
  renderWarmupTable(state.targetWeight);

  // 1RM
  const rm = calculate1RM(state.rmWeight, state.rmReps);
  $('#rm-result').textContent = rm;
  $('#rm-unit').textContent = state.unit;
}

// Event Bindings
document.addEventListener('DOMContentLoaded', () => {
  const targetInput = $('#target-weight');
  const barSelect = $('#bar-select');
  const collarSelect = $('#collar-select');
  const rmWeightInput = $('#rm-weight');
  const rmRepsInput = $('#rm-reps');

  targetInput.addEventListener('input', e => {
    state.targetWeight = parseFloat(e.target.value) || 0;
    render();
  });

  barSelect.addEventListener('change', e => {
    state.barWeight = parseFloat(e.target.value);
    render();
  });

  collarSelect.addEventListener('change', e => {
    state.collarsWeight = parseFloat(e.target.value);
    render();
  });

  rmWeightInput.addEventListener('input', e => {
    state.rmWeight = parseFloat(e.target.value) || 0;
    render();
  });

  rmRepsInput.addEventListener('input', e => {
    state.rmReps = parseInt(e.target.value, 10) || 1;
    render();
  });

  // +/- 5 step buttons
  $('#btn-minus-5').addEventListener('click', () => {
    if (state.targetWeight > state.barWeight) {
      state.targetWeight = Math.max(state.barWeight, state.targetWeight - 5);
      targetInput.value = state.targetWeight;
      render();
    }
  });

  $('#btn-plus-5').addEventListener('click', () => {
    state.targetWeight += 5;
    targetInput.value = state.targetWeight;
    render();
  });

  // Presets
  $$('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.targetWeight = parseFloat(btn.dataset.w);
      targetInput.value = state.targetWeight;
      render();
    });
  });

  // Unit toggle
  $$('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const newUnit = btn.dataset.unit;
      if (newUnit !== state.unit) {
        state.unit = newUnit;
        if (state.unit === 'kg') {
          state.targetWeight = Math.round(state.targetWeight / 2.20462 / 2.5) * 2.5;
          state.barWeight = 20;
          state.rmWeight = Math.round(state.rmWeight / 2.20462 / 2.5) * 2.5;
          barSelect.innerHTML = `
            <option value="20" selected>Olympic Men's Bar (20 kg)</option>
            <option value="15">Olympic Women's Bar (15 kg)</option>
            <option value="10">Technique Bar (10 kg)</option>
          `;
          collarSelect.innerHTML = `
            <option value="0" selected>None / Clips (0 kg)</option>
            <option value="2.5">Competition Collars (+2.5 kg total)</option>
          `;
          $('#preset-buttons').innerHTML = `
            <button type="button" class="btn-preset active" data-w="100">100 kg</button>
            <button type="button" class="btn-preset" data-w="140">140 kg</button>
            <button type="button" class="btn-preset" data-w="180">180 kg</button>
            <button type="button" class="btn-preset" data-w="220">220 kg</button>
          `;
        } else {
          state.targetWeight = Math.round(state.targetWeight * 2.20462 / 5) * 5;
          state.barWeight = 45;
          state.rmWeight = Math.round(state.rmWeight * 2.20462 / 5) * 5;
          barSelect.innerHTML = `
            <option value="45" selected>Standard Men's Bar (45 lbs)</option>
            <option value="35">Women's / Crossfit Bar (35 lbs)</option>
            <option value="15">Technique / Junior Bar (15 lbs)</option>
            <option value="55">Trap / Hex Bar (55 lbs)</option>
          `;
          collarSelect.innerHTML = `
            <option value="0" selected>None / Clips (0 lbs)</option>
            <option value="5">Competition Collars (+5 lbs total)</option>
          `;
          $('#preset-buttons').innerHTML = `
            <button type="button" class="btn-preset" data-w="135">135 (1 plate)</button>
            <button type="button" class="btn-preset active" data-w="225">225 (2 plates)</button>
            <button type="button" class="btn-preset" data-w="315">315 (3 plates)</button>
            <button type="button" class="btn-preset" data-w="405">405 (4 plates)</button>
          `;
        }
        targetInput.value = state.targetWeight;
        rmWeightInput.value = state.rmWeight;
        render();
      }
    });
  });

  render();
});
