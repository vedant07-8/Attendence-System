/**
 * Faculty Attendance Marking Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['faculty', 'admin'])) return;
  Layout.init('Mark Attendance');

  let assignedSubjects = [];
  let currentStudents = [];

  const subjectSelect = document.getElementById('select-subject');
  const classDisplay = document.getElementById('display-class');
  const classInput = document.getElementById('select-class');
  const dateInput = document.getElementById('select-date');
  const configForm = document.getElementById('attendance-config-form');
  const sheetWrapper = document.getElementById('attendance-sheet-wrapper');
  const tbody = document.getElementById('attendance-table-body');
  const alreadyMarkedAlert = document.getElementById('already-marked-alert');

  const countTotal = document.getElementById('count-total');
  const countPresent = document.getElementById('count-present');
  const countAbsent = document.getElementById('count-absent');
  const countRate = document.getElementById('count-rate');

  const btnAllPresent = document.getElementById('btn-mark-all-present');
  const btnAllAbsent = document.getElementById('btn-mark-all-absent');
  const btnSubmit = document.getElementById('btn-submit-attendance');
  const submitText = document.getElementById('btn-submit-text');
  const submitSpinner = document.getElementById('submit-spinner');

  // Set default date to today
  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.value = todayStr;

  // Load faculty assignments
  const loadAssignments = async () => {
    try {
      const res = await API.get('/faculty/me/assigned');
      if (res.success) {
        assignedSubjects = res.subjects;

        subjectSelect.innerHTML = '<option value="">Select Assigned Subject</option>' +
          assignedSubjects.map(s => `
            <option value="${s._id}" data-class-id="${s.class ? s.class._id : ''}" data-class-name="${s.class ? UI.escapeHtml(s.class.name) : ''}">
              ${UI.escapeHtml(s.code)} - ${UI.escapeHtml(s.name)}
            </option>
          `).join('');

        // Check if query parameters pre-selected subject
        const params = new URLSearchParams(window.location.search);
        const querySubjectId = params.get('subjectId');
        if (querySubjectId) {
          subjectSelect.value = querySubjectId;
          handleSubjectChange();
          loadSheet();
        }
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  const handleSubjectChange = () => {
    const selectedOpt = subjectSelect.selectedOptions[0];
    if (selectedOpt && selectedOpt.value) {
      classInput.value = selectedOpt.dataset.classId || '';
      classDisplay.value = selectedOpt.dataset.className || '';
    } else {
      classInput.value = '';
      classDisplay.value = '';
    }
  };

  subjectSelect.onchange = handleSubjectChange;

  // Load Sheet
  const loadSheet = async () => {
    const subjectId = subjectSelect.value;
    const classId = classInput.value;
    const date = dateInput.value;

    if (!subjectId || !classId || !date) {
      UI.showToast('Please select a subject, class, and date', 'error');
      return;
    }

    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-loader">
            <div class="spinner"></div> Loading students list...
          </td>
        </tr>
      `;
      sheetWrapper.style.display = 'block';

      const res = await API.get(`/attendance/sheet?classId=${classId}&subjectId=${subjectId}&date=${date}`);
      if (res.success) {
        currentStudents = res.students.map(st => ({
          ...st,
          // Default to 'present' if not previously marked, or keep existing status
          status: st.status || 'present'
        }));

        alreadyMarkedAlert.style.display = res.isAlreadyMarked ? 'inline-block' : 'none';

        renderSheet();
        updateCounters();
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load attendance sheet')}
          </td>
        </tr>
      `;
    }
  };

  const renderSheet = () => {
    if (currentStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="users"></i></div>
              <div class="empty-state-title">No students enrolled</div>
              <div class="empty-state-desc">There are no students assigned to this class section yet.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = currentStudents.map((st, index) => {
      const isPresent = st.status === 'present';
      return `
        <tr data-student-id="${st.studentId}">
          <td>${index + 1}</td>
          <td><strong style="color: var(--text-primary);">${UI.escapeHtml(st.rollNumber)}</strong></td>
          <td><div style="font-weight: 500; color: var(--text-primary);">${UI.escapeHtml(st.name)}</div></td>
          <td>${UI.escapeHtml(st.email || '-')}</td>
          <td style="text-align: center;">
            <div class="attendance-toggle-group">
              <button type="button" class="toggle-option toggle-present ${isPresent ? 'active-present' : ''}" data-student-id="${st.studentId}">
                Present
              </button>
              <button type="button" class="toggle-option toggle-absent ${!isPresent ? 'active-absent' : ''}" data-student-id="${st.studentId}">
                Absent
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach toggle listeners
    tbody.querySelectorAll('.toggle-present').forEach(btn => {
      btn.onclick = () => setStudentStatus(btn.dataset.studentId, 'present');
    });

    tbody.querySelectorAll('.toggle-absent').forEach(btn => {
      btn.onclick = () => setStudentStatus(btn.dataset.studentId, 'absent');
    });
  };

  const setStudentStatus = (studentId, status) => {
    const student = currentStudents.find(s => s.studentId === studentId);
    if (!student) return;

    student.status = status;
    const row = tbody.querySelector(`tr[data-student-id="${studentId}"]`);
    if (row) {
      const presentBtn = row.querySelector('.toggle-present');
      const absentBtn = row.querySelector('.toggle-absent');

      if (status === 'present') {
        presentBtn.classList.add('active-present');
        absentBtn.classList.remove('active-absent');
      } else {
        presentBtn.classList.remove('active-present');
        absentBtn.classList.add('active-absent');
      }
    }
    updateCounters();
  };

  const updateCounters = () => {
    const total = currentStudents.length;
    const present = currentStudents.filter(s => s.status === 'present').length;
    const absent = total - present;
    const pct = total > 0 ? (present / total) * 100 : 0;

    countTotal.textContent = total;
    countPresent.textContent = present;
    countAbsent.textContent = absent;
    countRate.textContent = `${pct.toFixed(1)}%`;
  };

  // Mass actions
  btnAllPresent.onclick = () => {
    currentStudents.forEach(st => st.status = 'present');
    renderSheet();
    updateCounters();
    UI.showToast('All students marked Present', 'info', 1800);
  };

  btnAllAbsent.onclick = () => {
    currentStudents.forEach(st => st.status = 'absent');
    renderSheet();
    updateCounters();
    UI.showToast('All students marked Absent', 'info', 1800);
  };

  configForm.onsubmit = (e) => {
    e.preventDefault();
    loadSheet();
  };

  // Submit attendance
  btnSubmit.onclick = async () => {
    if (currentStudents.length === 0) {
      UI.showToast('No students to submit attendance for', 'error');
      return;
    }

    const subjectId = subjectSelect.value;
    const classId = classInput.value;
    const date = dateInput.value;

    const records = currentStudents.map(st => ({
      studentId: st.studentId,
      status: st.status
    }));

    try {
      btnSubmit.disabled = true;
      submitText.style.display = 'none';
      submitSpinner.style.display = 'inline-block';

      const res = await API.post('/attendance/mark', {
        classId,
        subjectId,
        date,
        records
      });

      if (res.success) {
        UI.showToast(`Attendance saved! (${res.summary.present} Present, ${res.summary.absent} Absent)`, 'success');
        alreadyMarkedAlert.style.display = 'inline-block';
      }
    } catch (err) {
      UI.showToast(err.message || 'Failed to save attendance', 'error');
    } finally {
      btnSubmit.disabled = false;
      submitText.style.display = 'inline';
      submitSpinner.style.display = 'none';
    }
  };

  await loadAssignments();
});
