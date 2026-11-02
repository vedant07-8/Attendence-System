/**
 * Faculty Attendance History Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['faculty', 'admin'])) return;
  Layout.init('Attendance History');

  const subjectFilter = document.getElementById('filter-subject');
  const startDateInput = document.getElementById('filter-start-date');
  const endDateInput = document.getElementById('filter-end-date');
  const filterBtn = document.getElementById('btn-filter-apply');
  const tbody = document.getElementById('history-table-body');

  const loadFilterOptions = async () => {
    try {
      const res = await API.get('/faculty/me/assigned');
      if (res.success) {
        subjectFilter.innerHTML = '<option value="">All My Subjects</option>' +
          res.subjects.map(s => `<option value="${s._id}">${UI.escapeHtml(s.code)} - ${UI.escapeHtml(s.name)}</option>`).join('');
      }
    } catch (err) {
      console.error('Error loading subject filter:', err);
    }
  };

  const loadHistory = async () => {
    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="table-loader">
            <div class="spinner"></div> Loading attendance history...
          </td>
        </tr>
      `;

      const params = new URLSearchParams();
      if (subjectFilter.value) params.set('subjectId', subjectFilter.value);
      if (startDateInput.value) params.set('startDate', startDateInput.value);
      if (endDateInput.value) params.set('endDate', endDateInput.value);

      const res = await API.get(`/attendance/history?${params.toString()}`);
      if (res.success) {
        renderHistory(res.data);
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load history')}
          </td>
        </tr>
      `;
    }
  };

  const renderHistory = (sessions) => {
    if (sessions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="history"></i></div>
              <div class="empty-state-title">No attendance sessions found</div>
              <div class="empty-state-desc">Try widening your date range or select another subject filter.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = sessions.map(sess => {
      const dateFormatted = new Date(sess.date).toISOString().split('T')[0];
      return `
        <tr>
          <td><strong style="color: var(--text-primary);">${UI.formatDate(sess.date)}</strong></td>
          <td><span class="badge badge-accent">${UI.escapeHtml(sess.subjectCode)}</span></td>
          <td><div style="font-weight: 500; color: var(--text-primary);">${UI.escapeHtml(sess.subjectName)}</div></td>
          <td><span class="badge badge-neutral">${UI.escapeHtml(sess.className ? sess.className.split('(')[0].trim() : '-')}</span></td>
          <td>${sess.totalStudents}</td>
          <td style="color: var(--success); font-weight: 500;">${sess.presentCount}</td>
          <td style="color: var(--danger); font-weight: 500;">${sess.absentCount}</td>
          <td>${UI.getAttendanceBadge(sess.percentage)}</td>
          <td style="text-align: right;">
            <a href="/faculty/attendance.html?subjectId=${sess.subjectId}&classId=${sess.classId}&date=${dateFormatted}" class="btn btn-secondary btn-sm" title="Reopen sheet for this date">
              <i data-lucide="edit-2"></i> Edit
            </a>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  filterBtn.onclick = loadHistory;
  subjectFilter.onchange = loadHistory;

  await loadFilterOptions();
  await loadHistory();
});
