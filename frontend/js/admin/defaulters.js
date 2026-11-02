/**
 * Admin Defaulters List Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['admin', 'faculty'])) return;
  Layout.init('Defaulters Warning List');

  let classes = [];
  let defaulters = [];

  const filterClass = document.getElementById('filter-class');
  const tbody = document.getElementById('defaulters-table-body');
  const printBtn = document.getElementById('btn-print-defaulters');

  const loadClasses = async () => {
    try {
      const res = await API.get('/classes');
      if (res.success) {
        classes = res.data;
        filterClass.innerHTML = '<option value="">All Classes</option>' +
          classes.map(c => `<option value="${c._id}">${UI.escapeHtml(c.name)}</option>`).join('');
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadDefaulters = async () => {
    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="table-loader">
            <div class="spinner"></div> Calculating defaulter statistics...
          </td>
        </tr>
      `;

      const classId = filterClass.value;
      const query = classId ? `?classId=${classId}` : '';
      const res = await API.get(`/reports/defaulters${query}`);

      if (res.success) {
        defaulters = res.data;
        renderDefaultersTable();
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load defaulters list')}
          </td>
        </tr>
      `;
    }
  };

  const renderDefaultersTable = () => {
    if (defaulters.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon" style="background-color: var(--success-subtle); color: var(--success);">
                <i data-lucide="check-circle-2"></i>
              </div>
              <div class="empty-state-title">No Defaulters Found!</div>
              <div class="empty-state-desc">Every student in this filter is currently maintaining at least 75% overall attendance.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = defaulters.map(st => `
      <tr>
        <td><strong style="color: var(--text-primary);">${UI.escapeHtml(st.rollNumber)}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${UI.escapeHtml(st.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${UI.escapeHtml(st.email)}</div>
        </td>
        <td>
          <span class="badge badge-neutral">
            ${UI.escapeHtml(st.className ? st.className.split('(')[0].trim() : '-')}
          </span>
        </td>
        <td><strong>${st.total}</strong></td>
        <td style="color: var(--success); font-weight: 500;">${st.present}</td>
        <td style="color: var(--danger); font-weight: 500;">${st.absent}</td>
        <td>
          <span class="badge badge-absent">
            <i data-lucide="alert-triangle"></i> ${st.percentage.toFixed(1)}%
          </span>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  filterClass.onchange = loadDefaulters;
  printBtn.onclick = () => window.print();

  await loadClasses();
  await loadDefaulters();
});
