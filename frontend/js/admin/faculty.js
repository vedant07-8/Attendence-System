/**
 * Admin Faculty Management Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['admin'])) return;
  Layout.init('Manage Faculty');

  let facultyList = [];

  const searchInput = document.getElementById('search-faculty');
  const tbody = document.getElementById('faculty-table-body');
  const modal = document.getElementById('faculty-modal-backdrop');
  const form = document.getElementById('faculty-form');
  const modalTitle = document.getElementById('faculty-modal-title');
  const passwordInput = document.getElementById('faculty-password');
  const passwordHelp = document.getElementById('faculty-password-help');

  const loadFaculty = async () => {
    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="table-loader">
            <div class="spinner"></div> Loading faculty directory...
          </td>
        </tr>
      `;

      const res = await API.get('/faculty');
      if (res.success) {
        facultyList = res.data;
        renderFacultyTable();
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load faculty directory')}
          </td>
        </tr>
      `;
    }
  };

  const renderFacultyTable = () => {
    const search = searchInput.value.trim().toLowerCase();
    const filtered = facultyList.filter(f => {
      const name = f.user ? f.user.name.toLowerCase() : '';
      const email = f.user ? f.user.email.toLowerCase() : '';
      const empId = f.employeeId.toLowerCase();
      const dept = f.department.toLowerCase();
      return name.includes(search) || email.includes(search) || empId.includes(search) || dept.includes(search);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="user-check"></i></div>
              <div class="empty-state-title">No faculty members found</div>
              <div class="empty-state-desc">Click "Add Faculty Member" to onboard new teachers.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = filtered.map(f => {
      const subjectsHtml = f.subjects && f.subjects.length > 0
        ? f.subjects.map(s => `<span class="badge badge-accent" style="margin-right: 4px; margin-bottom: 2px;">${UI.escapeHtml(s.code)}</span>`).join('')
        : '<span style="color: var(--text-muted); font-size: 0.8rem;">None assigned</span>';

      return `
        <tr>
          <td><strong style="color: var(--text-primary);">${UI.escapeHtml(f.employeeId)}</strong></td>
          <td>
            <div style="font-weight: 500; color: var(--text-primary);">${UI.escapeHtml(f.user ? f.user.name : '-')}</div>
          </td>
          <td>${UI.escapeHtml(f.department)}</td>
          <td>${UI.escapeHtml(f.user ? f.user.email : '-')}</td>
          <td>${subjectsHtml}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm btn-edit" data-id="${f._id}">
                <i data-lucide="edit-2"></i> Edit
              </button>
              <button class="btn btn-danger btn-sm btn-delete" data-id="${f._id}" data-name="${UI.escapeHtml(f.user ? f.user.name : f.employeeId)}">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach listeners
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => openEditModal(btn.dataset.id);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = () => handleDelete(btn.dataset.id, btn.dataset.name);
    });
  };

  const openAddModal = () => {
    form.reset();
    document.getElementById('faculty-id').value = '';
    modalTitle.textContent = 'Add Faculty Member';
    passwordInput.required = true;
    passwordHelp.textContent = '(Min 6 characters)';
    modal.classList.add('active');
  };

  const openEditModal = (id) => {
    const f = facultyList.find(item => item._id === id);
    if (!f) return;

    document.getElementById('faculty-id').value = f._id;
    document.getElementById('faculty-name').value = f.user ? f.user.name : '';
    document.getElementById('faculty-emp-id').value = f.employeeId;
    document.getElementById('faculty-email').value = f.user ? f.user.email : '';
    document.getElementById('faculty-dept').value = f.department;

    modalTitle.textContent = `Edit Faculty: ${f.employeeId}`;
    passwordInput.value = '';
    passwordInput.required = false;
    passwordHelp.textContent = '(Leave blank to keep current password)';

    modal.classList.add('active');
  };

  const closeModal = () => {
    modal.classList.remove('active');
  };

  const handleDelete = (id, name) => {
    UI.confirm({
      title: 'Remove Faculty Member',
      message: `Are you sure you want to remove "${name}"? They will be unassigned from any active subjects.`,
      confirmText: 'Remove Faculty',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await API.delete(`/faculty/${id}`);
          if (res.success) {
            UI.showToast('Faculty member removed successfully', 'success');
            loadFaculty();
          }
        } catch (err) {
          UI.showToast(err.message || 'Failed to delete faculty', 'error');
        }
      }
    });
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('faculty-id').value;
    const isEdit = !!id;

    const payload = {
      name: document.getElementById('faculty-name').value.trim(),
      employeeId: document.getElementById('faculty-emp-id').value.trim(),
      email: document.getElementById('faculty-email').value.trim(),
      department: document.getElementById('faculty-dept').value.trim()
    };

    const passwordVal = passwordInput.value.trim();
    if (!isEdit || passwordVal) {
      if (passwordVal.length < 6) {
        UI.showToast('Password must be at least 6 characters long', 'error');
        return;
      }
      payload.password = passwordVal;
    }

    try {
      let res;
      if (isEdit) {
        res = await API.put(`/faculty/${id}`, payload);
      } else {
        res = await API.post('/faculty', payload);
      }

      if (res.success) {
        UI.showToast(isEdit ? 'Faculty updated successfully' : 'Faculty registered successfully', 'success');
        closeModal();
        loadFaculty();
      }
    } catch (err) {
      UI.showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Bind events
  document.getElementById('btn-add-faculty').onclick = openAddModal;
  document.getElementById('faculty-modal-close').onclick = closeModal;
  document.getElementById('faculty-modal-cancel').onclick = closeModal;

  searchInput.oninput = () => renderFacultyTable();

  await loadFaculty();
});
