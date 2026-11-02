/**
 * Student Attendance History Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['student'])) return;
  Layout.init('Attendance History');

  const subjectFilter = document.getElementById('filter-subject');
  const statusFilter = document.getElementById('filter-status');
  const tbody = document.getElementById('student-history-tbody');

  let studentId = null;

  const init = async () => {
    try {
      // First get student profile ID from dashboard
      const dashRes = await API.get('/dashboard/student');
      if (dashRes.success) {
        studentId = dashRes.data.student.id;

        // Populate subjects filter
        subjectFilter.innerHTML = '<option value="">All Subjects</option>' +
          dashRes.data.subjects.map(s => `<option value="${s.subjectId}">${UI.escapeHtml(s.subjectCode)} - ${UI.escapeHtml(s.subjectName)}</option>`).join('');

        await loadLogs();
      }
    } catch (err) {
      console.error('Init error:', err);
    }
  };

  const loadLogs = async () => {
    if (!studentId) return;

    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-loader">
            <div class="spinner"></div> Loading attendance records...
          </td>
        </tr>
      `;

      const params = new URLSearchParams();
      if (subjectFilter.value) params.set('subjectId', subjectFilter.value);
      if (statusFilter.value) params.set('status', statusFilter.value);

      const res = await API.get(`/attendance/student/${studentId}?${params.toString()}`);
      if (res.success) {
        renderLogs(res.data);
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load attendance logs')}
          </td>
        </tr>
      `;
    }
  };

  const renderLogs = (logs) => {
    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="calendar"></i></div>
              <div class="empty-state-title">No attendance logs found</div>
              <div class="empty-state-desc">Try clearing your subject or status filters.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const isPresent = l.status === 'present';
      const facultyName = l.markedBy && l.markedBy.user ? l.markedBy.user.name : 'Faculty';

      return `
        <tr>
          <td><strong style="color: var(--text-primary);">${UI.formatDate(l.date)}</strong></td>
          <td><span class="badge badge-accent">${UI.escapeHtml(l.subject ? l.subject.code : '-')}</span></td>
          <td><div style="font-weight: 500; color: var(--text-primary);">${UI.escapeHtml(l.subject ? l.subject.name : '-')}</div></td>
          <td>${UI.escapeHtml(facultyName)}</td>
          <td style="text-align: center;">
            <span class="badge ${isPresent ? 'badge-present' : 'badge-absent'}">
              <i data-lucide="${isPresent ? 'check' : 'x'}"></i>
              ${isPresent ? 'Present' : 'Absent'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  subjectFilter.onchange = loadLogs;
  statusFilter.onchange = loadLogs;

  await init();
});
