/**
 * Monthly Attendance Report Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['admin', 'faculty'])) return;
  Layout.init('Monthly Attendance Reports');

  let classes = [];
  let subjects = [];

  const classSelect = document.getElementById('report-class');
  const subjectSelect = document.getElementById('report-subject');
  const monthSelect = document.getElementById('report-month');
  const yearSelect = document.getElementById('report-year');
  const form = document.getElementById('report-filter-form');
  const tbody = document.getElementById('report-table-body');
  const banner = document.getElementById('report-header-banner');
  const bannerMeta = document.getElementById('banner-meta');
  const bannerSub = document.getElementById('banner-sub');
  const bannerAvg = document.getElementById('banner-avg');
  const printBtn = document.getElementById('btn-print-report');

  // Set default month to current month
  const today = new Date();
  monthSelect.value = today.getMonth() + 1;
  yearSelect.value = today.getFullYear();

  // Load Classes
  const loadClasses = async () => {
    try {
      const res = await API.get('/classes');
      if (res.success) {
        classes = res.data;
        classSelect.innerHTML = '<option value="">Select Class</option>' +
          classes.map(c => `<option value="${c._id}">${UI.escapeHtml(c.name)}</option>`).join('');
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  // Load Subjects when class changes
  classSelect.onchange = async () => {
    const classId = classSelect.value;
    if (!classId) {
      subjectSelect.innerHTML = '<option value="">All Subjects</option>';
      return;
    }

    try {
      const res = await API.get(`/subjects?classId=${classId}`);
      if (res.success) {
        subjects = res.data;
        subjectSelect.innerHTML = '<option value="">All Subjects</option>' +
          subjects.map(s => `<option value="${s._id}">${UI.escapeHtml(s.code)} - ${UI.escapeHtml(s.name)}</option>`).join('');
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  // Generate Report
  form.onsubmit = async (e) => {
    e.preventDefault();

    const classId = classSelect.value;
    if (!classId) {
      UI.showToast('Please select a class to generate report', 'error');
      return;
    }

    const subjectId = subjectSelect.value;
    const month = monthSelect.value;
    const year = yearSelect.value;

    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-loader">
            <div class="spinner"></div> Generating monthly report...
          </td>
        </tr>
      `;

      const params = new URLSearchParams({
        classId,
        month,
        year
      });
      if (subjectId) params.set('subjectId', subjectId);

      const res = await API.get(`/reports/monthly?${params.toString()}`);
      if (res.success) {
        const { meta, data } = res;

        // Render Banner
        banner.style.display = 'block';
        bannerMeta.textContent = `${meta.className} — ${meta.monthName} ${meta.year}`;
        bannerSub.textContent = `Subject Filter: ${meta.subjectName}`;

        const totalHeldAvg = data.reduce((acc, st) => acc + (st.percentage || 0), 0) / (data.length || 1);
        bannerAvg.textContent = `${totalHeldAvg.toFixed(1)}%`;

        if (data.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <div class="empty-state-icon"><i data-lucide="calendar"></i></div>
                  <div class="empty-state-title">No attendance logs found</div>
                  <div class="empty-state-desc">No sessions were marked for this class/subject in ${meta.monthName} ${meta.year}.</div>
                </div>
              </td>
            </tr>
          `;
          if (window.lucide) window.lucide.createIcons();
          return;
        }

        tbody.innerHTML = data.map(st => `
          <tr>
            <td><strong style="color: var(--text-primary);">${UI.escapeHtml(st.rollNumber)}</strong></td>
            <td><div style="font-weight: 500; color: var(--text-primary);">${UI.escapeHtml(st.name)}</div></td>
            <td><strong>${st.total}</strong></td>
            <td style="color: var(--success); font-weight: 500;">${st.present}</td>
            <td style="color: var(--danger); font-weight: 500;">${st.absent}</td>
            <td>
              <div style="font-weight: 600; color: ${st.percentage >= 75 ? 'var(--success)' : 'var(--danger)'};">
                ${st.percentage.toFixed(1)}%
              </div>
            </td>
            <td>
              ${st.total === 0 ? '<span class="badge badge-neutral">No Sessions</span>' : UI.getAttendanceBadge(st.percentage)}
            </td>
          </tr>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to generate report')}
          </td>
        </tr>
      `;
    }
  };

  printBtn.onclick = () => window.print();

  await loadClasses();
});
