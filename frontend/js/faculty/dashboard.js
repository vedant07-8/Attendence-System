/**
 * Faculty Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['faculty'])) return;
  Layout.init('Faculty Dashboard');

  const statSubjects = document.getElementById('stat-subjects');
  const statClasses = document.getElementById('stat-classes');
  const statStudents = document.getElementById('stat-students');
  const statAvgPct = document.getElementById('stat-avg-pct');
  const subjectsTbody = document.getElementById('assigned-subjects-tbody');
  const historyTbody = document.getElementById('faculty-recent-tbody');

  try {
    const res = await API.get('/dashboard/faculty');
    if (res.success) {
      const { stats, subjects, recentHistory } = res.data;

      statSubjects.textContent = stats.assignedSubjectsCount;
      statClasses.textContent = stats.assignedClassesCount;
      statStudents.textContent = stats.totalStudents;
      statAvgPct.textContent = `${stats.overallPercentage.toFixed(1)}%`;

      // Render Assigned Subjects
      if (subjects.length === 0) {
        subjectsTbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="book-open"></i></div>
                <div class="empty-state-title">No subjects assigned</div>
                <div class="empty-state-desc">You are not currently assigned to any subjects. Please contact the administrator.</div>
              </div>
            </td>
          </tr>
        `;
      } else {
        subjectsTbody.innerHTML = subjects.map(s => `
          <tr>
            <td><strong style="color: var(--brand-accent);">${UI.escapeHtml(s.code)}</strong></td>
            <td><div style="font-weight: 600; color: var(--text-primary);">${UI.escapeHtml(s.name)}</div></td>
            <td>
              <span class="badge badge-neutral">${UI.escapeHtml(s.class ? s.class.name.split('(')[0].trim() : '-')}</span>
            </td>
            <td><strong>${s.totalLectures}</strong> sessions</td>
            <td>${UI.getAttendanceBadge(s.averageAttendance)}</td>
            <td>
              ${s.isMarkedToday
                ? '<span class="badge badge-present"><i data-lucide="check"></i> Marked Today</span>'
                : '<span class="badge badge-warning"><i data-lucide="clock"></i> Pending Today</span>'}
            </td>
            <td style="text-align: right;">
              <a href="/faculty/attendance.html?subjectId=${s._id}&classId=${s.class ? s.class._id : ''}" class="btn btn-secondary btn-sm">
                <i data-lucide="edit-3"></i> Mark Attendance
              </a>
            </td>
          </tr>
        `).join('');
      }

      // Render Recent History
      if (recentHistory.length === 0) {
        historyTbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
              No recent attendance recorded under your faculty profile.
            </td>
          </tr>
        `;
      } else {
        historyTbody.innerHTML = recentHistory.map(sess => `
          <tr>
            <td>${UI.formatDate(sess.date)}</td>
            <td><strong>${UI.escapeHtml(sess.subjectCode)}</strong> <span style="font-size: 0.8rem; color: var(--text-muted);">(${UI.escapeHtml(sess.subjectName)})</span></td>
            <td><span class="badge badge-neutral">${UI.escapeHtml(sess.className ? sess.className.split('(')[0].trim() : '-')}</span></td>
            <td><strong>${sess.present}</strong> / ${sess.total}</td>
            <td>${UI.getAttendanceBadge(sess.percentage)}</td>
          </tr>
        `).join('');
      }

      if (window.lucide) window.lucide.createIcons();
    }
  } catch (err) {
    UI.showToast(err.message || 'Failed to load faculty dashboard', 'error');
  }
});
