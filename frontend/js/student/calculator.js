/**
 * Student 75% Attendance Calculator Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['student'])) return;
  Layout.init('75% Attendance Calculator');

  let studentData = null;

  const presetSelect = document.getElementById('calc-preset-select');
  const inputPresent = document.getElementById('input-present');
  const inputTotal = document.getElementById('input-total');
  const inputTarget = document.getElementById('input-target');
  const targetSlider = document.getElementById('input-target-slider');

  const resultBox = document.getElementById('calc-result-box');
  const currentPctEl = document.getElementById('result-current-pct');
  const badgeSlot = document.getElementById('result-badge-slot');
  const instructionEl = document.getElementById('result-instruction');
  const mathFormulaEl = document.getElementById('math-formula-text');

  const simAttendInput = document.getElementById('sim-attend');
  const simProjectedPctEl = document.getElementById('sim-projected-pct');

  const btn75 = document.getElementById('btn-set-75');
  const btn80 = document.getElementById('btn-set-80');
  const btn85 = document.getElementById('btn-set-85');

  // Load student data to populate auto-fill presets
  const loadData = async () => {
    try {
      const res = await API.get('/dashboard/student');
      if (res.success) {
        studentData = res.data;

        // Build preset dropdown
        let optionsHtml = '<option value="overall">Overall Attendance (All Subjects Combined)</option>';
        studentData.subjects.forEach(s => {
          optionsHtml += `<option value="${s.subjectId}">${UI.escapeHtml(s.subjectCode)} - ${UI.escapeHtml(s.subjectName)}</option>`;
        });
        presetSelect.innerHTML = optionsHtml;

        // Check if URL query params had pre-filled values
        const params = new URLSearchParams(window.location.search);
        if (params.get('present') && params.get('total')) {
          inputPresent.value = params.get('present');
          inputTotal.value = params.get('total');
        } else {
          // Default to overall
          inputPresent.value = studentData.overall.present;
          inputTotal.value = studentData.overall.total;
        }

        recalculate();
      }
    } catch (err) {
      console.error('Error loading student data:', err);
    }
  };

  presetSelect.onchange = () => {
    if (!studentData) return;
    const val = presetSelect.value;
    if (val === 'overall') {
      inputPresent.value = studentData.overall.present;
      inputTotal.value = studentData.overall.total;
    } else {
      const subj = studentData.subjects.find(s => s.subjectId === val);
      if (subj) {
        inputPresent.value = subj.present;
        inputTotal.value = subj.total;
      }
    }
    recalculate();
  };

  const recalculate = () => {
    const present = Math.max(0, parseInt(inputPresent.value) || 0);
    const total = Math.max(present, parseInt(inputTotal.value) || 0);
    const target = Math.min(100, Math.max(1, parseInt(inputTarget.value) || 75));

    inputPresent.value = present;
    inputTotal.value = total;
    targetSlider.value = target;

    const currentPct = total > 0 ? (present / total) * 100 : 0;
    currentPctEl.textContent = `${currentPct.toFixed(1)}%`;

    const targetDecimal = target / 100;

    if (currentPct >= target) {
      // Eligible / Above Target
      resultBox.style.backgroundColor = 'var(--success-subtle)';
      resultBox.style.borderColor = 'var(--success-border)';
      currentPctEl.style.color = 'var(--success)';
      badgeSlot.innerHTML = `<span class="badge badge-present"><i data-lucide="check-circle-2"></i> Meets Target (&gt;= ${target}%)</span>`;

      // Safe absences calculation: floor((100 * present - target * total) / target)
      const safeAbsences = Math.floor(((100 * present) - (target * total)) / target);
      const safeCount = Math.max(0, safeAbsences);
      const newTotalIfMiss = total + safeCount;
      const newPctIfMiss = newTotalIfMiss > 0 ? ((present / newTotalIfMiss) * 100).toFixed(1) : 100;

      instructionEl.innerHTML = `
        You are in <strong>good standing</strong>! You can safely miss up to <strong style="color: var(--success); font-size: 1.15em;">${safeCount}</strong> upcoming class(es) without dropping below <strong>${target}%</strong>.
        <div style="margin-top: 6px; font-size: 0.85em; color: var(--text-muted);">
          Verification: If you miss ${safeCount} classes, attendance will be <strong>${present} / ${newTotalIfMiss} = ${newPctIfMiss}%</strong> (&gt;= ${target}%).
        </div>
      `;

      mathFormulaEl.innerHTML = `
        Formula for Safe Bunks (m):<br>
        present / (total + m) &gt;= ${target} / 100<br>
        m &lt;= ⌊(100 × ${present} - ${target} × ${total}) / ${target}⌋ = ⌊${100 * present - target * total} / ${target}⌋ = <strong>${safeCount} safe absences</strong>
      `;
    } else {
      // Below Target / Defaulter
      resultBox.style.backgroundColor = 'var(--danger-subtle)';
      resultBox.style.borderColor = 'var(--danger-border)';
      currentPctEl.style.color = 'var(--danger)';
      badgeSlot.innerHTML = `<span class="badge badge-absent"><i data-lucide="alert-triangle"></i> Below Target (&lt; ${target}%)</span>`;

      // Classes needed: ceil((target * total - 100 * present) / (100 - target))
      let needed = 0;
      if (target < 100) {
        needed = Math.ceil(((target * total) - (100 * present)) / (100 - target));
      } else {
        needed = -1; // impossible if missed > 0
      }

      const newPresent = present + needed;
      const newTotal = total + needed;
      const newPct = newTotal > 0 ? ((newPresent / newTotal) * 100).toFixed(1) : 0;

      instructionEl.innerHTML = `
        You are currently <strong>below target</strong>. You must attend the next <strong style="color: var(--danger); font-size: 1.2em;">+${needed}</strong> consecutive lecture(s) without missing any to achieve <strong>${target}%</strong> attendance.
        <div style="margin-top: 6px; font-size: 0.85em; color: var(--text-muted);">
          Verification: After attending ${needed} classes, attendance becomes <strong>${newPresent} / ${newTotal} = ${newPct}%</strong> (&gt;= ${target}%).
        </div>
      `;

      mathFormulaEl.innerHTML = `
        Formula for Consecutive Classes Needed (n):<br>
        (present + n) / (total + n) &gt;= ${target} / 100<br>
        n &gt;= ⌈(${target} × total - 100 × present) / (100 - ${target})⌉<br>
        n = ⌈(${target * total} - ${100 * present}) / ${100 - target}⌉ = ⌈${target * total - 100 * present} / ${100 - target}⌉ = <strong>+${needed} classes</strong>
      `;
    }

    // What-if simulation
    const simAttend = parseInt(simAttendInput.value) || 0;
    const simPresent = present + simAttend;
    const simTotal = total + simAttend;
    const simPct = simTotal > 0 ? (simPresent / simTotal) * 100 : 0;

    simProjectedPctEl.textContent = `${simPct.toFixed(1)}%`;
    simProjectedPctEl.style.color = simPct >= target ? 'var(--success)' : 'var(--danger)';

    if (window.lucide) window.lucide.createIcons();
  };

  // Sync inputs
  inputPresent.oninput = recalculate;
  inputTotal.oninput = recalculate;

  inputTarget.oninput = () => {
    targetSlider.value = inputTarget.value;
    recalculate();
  };

  targetSlider.oninput = () => {
    inputTarget.value = targetSlider.value;
    recalculate();
  };

  simAttendInput.oninput = recalculate;

  btn75.onclick = () => { inputTarget.value = 75; recalculate(); };
  btn80.onclick = () => { inputTarget.value = 80; recalculate(); };
  btn85.onclick = () => { inputTarget.value = 85; recalculate(); };

  await loadData();
});
