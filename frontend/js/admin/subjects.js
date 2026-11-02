/**
 * Admin Subject Management Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['admin'])) return;
  Layout.init('Manage Subjects');

  let classes = [];
  let facultyList = [];
  let subjects = [];

  const filterClass = document.getElementById('filter-class');
  const searchInput = document.getElementById('search-subject');
  const tbody = document.getElementById('subjects-table-body');
  const modal = document.getElementById('subject-modal-backdrop');
  const form = document.getElementById('subject-form');
  const modalTitle = document.getElementById('subject-modal-title');
  const classSelect = document.getElementById('subject-class');
  const facultySelect = document.getElementById('subject-faculty');

  const loadDependencies = async () => {
    try {
      const [classRes, facultyRes] = await Promise.all([
        API.get('/classes'),
        API.get('/faculty')
      ]);

      if (classRes.success) {
        classes = classRes.data;
        filterClass.innerHTML = '<option value="">All Classes</option>' +
          classes.map(c => `<option value="${c._id}">${UI.escapeHtml(c.name)}</option>`).join('');

        classSelect.innerHTML = '<option value="">Select Class</option>' +
          classes.map(c => `<option value="${c._id}">${UI.escapeHtml(c.name)}</option>`).join('');
      }

      if (facultyRes.success) {
        facultyList = facultyRes.data;
        facultySelect.innerHTML = '<option value="">-- Unassigned --</option>' +
          facultyList.map(f => `<option value="${f._id}">${UI.escapeHtml(f.user ? f.user.name : f.employeeId)} (${UI.escapeHtml(f.employeeId)})</option>`).join('');
      }
    } catch (err) {
      console.error('Error loading options:', err);
    }
  };

  const loadSubjects = async () => {
    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-loader">
            <div class="spinner"></div> Loading subjects...
          </td>
        </tr>
      `;

      const classId = filterClass.value;
      const query = classId ? `?classId=${classId}` : '';
      const res = await API.get(`/subjects${query}`);

      if (res.success) {
        subjects = res.data;
        renderSubjectsTable();
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load subjects')}
          </td>
        </tr>
      `;
    }
  };

  const renderSubjectsTable = () => {
    const search = searchInput.value.trim().toLowerCase();
    const filtered = subjects.filter(s => {
      return s.name.toLowerCase().includes(search) || s.code.toLowerCase().includes(search);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="book-open"></i></div>
              <div class="empty-state-title">No subjects found</div>
              <div class="empty-state-desc">Click "Add New Subject" to configure course offerings.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const facultyName = s.faculty && s.faculty.user ? s.faculty.user.name : null;
      const facultyHtml = facultyName
        ? `<div style="font-weight: 500; color: var(--text-primary);"><i data-lucide="user-check" style="display: inline; width: 14px; height: 14px; vertical-align: -2px; color: var(--success);"></i> ${UI.escapeHtml(facultyName)} <span style="color: var(--text-muted); font-size: 0.8rem;">(${UI.escapeHtml(s.faculty.employeeId)})</span></div>`
        : '<span class="badge badge-warning">Unassigned</span>';

      return `
        <tr>
          <td><strong style="color: var(--brand-accent);">${UI.escapeHtml(s.code)}</strong></td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${UI.escapeHtml(s.name)}</div>
          </td>
          <td>
            <span class="badge badge-neutral">
              ${UI.escapeHtml(s.class ? s.class.name.split('(')[0].trim() : '-')}
            </span>
          </td>
          <td>${facultyHtml}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm btn-edit" data-id="${s._id}">
                <i data-lucide="edit-2"></i> Edit
              </button>
              <button class="btn btn-danger btn-sm btn-delete" data-id="${s._id}" data-name="${UI.escapeHtml(s.name)}">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => openEditModal(btn.dataset.id);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = () => handleDelete(btn.dataset.id, btn.dataset.name);
    });
  };

  const openAddModal = () => {
    form.reset();
    document.getElementById('subject-id').value = '';
    modalTitle.textContent = 'Add New Subject';
    modal.classList.add('active');
  };

  const openEditModal = (id) => {
    const s = subjects.find(item => item._id === id);
    if (!s) return;

    document.getElementById('subject-id').value = s._id;
    document.getElementById('subject-code').value = s.code;
    document.getElementById('subject-name').value = s.name;
    document.getElementById('subject-class').value = s.class ? s.class._id : '';
    document.getElementById('subject-faculty').value = s.faculty ? s.faculty._id : '';

    modalTitle.textContent = `Edit Subject: ${s.code}`;
    modal.classList.add('active');
  };

  const closeModal = () => {
    modal.classList.remove('active');
  };

  const handleDelete = (id, name) => {
    UI.confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete subject "${name}"? Subjects with existing attendance logs cannot be deleted until cleared.`,
      confirmText: 'Delete Subject',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await API.delete(`/subjects/${id}`);
          if (res.success) {
            UI.showToast('Subject deleted successfully', 'success');
            loadSubjects();
          }
        } catch (err) {
          UI.showToast(err.message || 'Cannot delete subject', 'error');
        }
      }
    });
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('subject-id').value;
    const isEdit = !!id;

    const payload = {
      code: document.getElementById('subject-code').value.trim().toUpperCase(),
      name: document.getElementById('subject-name').value.trim(),
      classId: document.getElementById('subject-class').value,
      facultyId: document.getElementById('subject-faculty').value || null
    };

    try {
      let res;
      if (isEdit) {
        res = await API.put(`/subjects/${id}`, payload);
      } else {
        res = await API.post('/subjects', payload);
      }

      if (res.success) {
        UI.showToast(isEdit ? 'Subject updated successfully' : 'Subject created successfully', 'success');
        closeModal();
        loadSubjects();
      }
    } catch (err) {
      UI.showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Bind events
  document.getElementById('btn-add-subject').onclick = openAddModal;
  document.getElementById('subject-modal-close').onclick = closeModal;
  document.getElementById('subject-modal-cancel').onclick = closeModal;

  filterClass.onchange = loadSubjects;
  searchInput.oninput = () => renderSubjectsTable();

  await loadDependencies();
  await loadSubjects();
});
