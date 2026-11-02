/**
 * Admin Class Management Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['admin'])) return;
  Layout.init('Manage Classes');

  let classes = [];

  const searchInput = document.getElementById('search-class');
  const tbody = document.getElementById('classes-table-body');
  const modal = document.getElementById('class-modal-backdrop');
  const form = document.getElementById('class-form');
  const modalTitle = document.getElementById('class-modal-title');

  const loadClasses = async () => {
    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-loader">
            <div class="spinner"></div> Loading classes...
          </td>
        </tr>
      `;

      const res = await API.get('/classes');
      if (res.success) {
        classes = res.data;
        renderClassesTable();
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load classes')}
          </td>
        </tr>
      `;
    }
  };

  const renderClassesTable = () => {
    const search = searchInput.value.trim().toLowerCase();
    const filtered = classes.filter(c => {
      return c.name.toLowerCase().includes(search) || c.department.toLowerCase().includes(search);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="layers"></i></div>
              <div class="empty-state-title">No classes found</div>
              <div class="empty-state-desc">Click "Create New Class" to set up academic sections.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td><strong style="color: var(--text-primary);">${UI.escapeHtml(c.name)}</strong></td>
        <td>${UI.escapeHtml(c.department)}</td>
        <td>Year ${c.year}</td>
        <td><span class="badge badge-neutral">${UI.escapeHtml(c.division)}</span></td>
        <td><strong>${c.studentCount || 0}</strong> students</td>
        <td><strong>${c.subjectCount || 0}</strong> subjects</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${c._id}">
              <i data-lucide="edit-2"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="${c._id}" data-name="${UI.escapeHtml(c.name)}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

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
    document.getElementById('class-id').value = '';
    modalTitle.textContent = 'Create New Class';
    modal.classList.add('active');
  };

  const openEditModal = (id) => {
    const c = classes.find(item => item._id === id);
    if (!c) return;

    document.getElementById('class-id').value = c._id;
    document.getElementById('class-name').value = c.name;
    document.getElementById('class-dept').value = c.department;
    document.getElementById('class-year').value = c.year;
    document.getElementById('class-div').value = c.division;

    modalTitle.textContent = 'Edit Class';
    modal.classList.add('active');
  };

  const closeModal = () => {
    modal.classList.remove('active');
  };

  const handleDelete = (id, name) => {
    UI.confirm({
      title: 'Delete Class',
      message: `Are you sure you want to delete class "${name}"? Classes with enrolled students or subjects cannot be deleted until cleared.`,
      confirmText: 'Delete Class',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await API.delete(`/classes/${id}`);
          if (res.success) {
            UI.showToast('Class deleted successfully', 'success');
            loadClasses();
          }
        } catch (err) {
          UI.showToast(err.message || 'Cannot delete class', 'error');
        }
      }
    });
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('class-id').value;
    const isEdit = !!id;

    const payload = {
      name: document.getElementById('class-name').value.trim(),
      department: document.getElementById('class-dept').value.trim(),
      year: Number(document.getElementById('class-year').value),
      division: document.getElementById('class-div').value.trim()
    };

    try {
      let res;
      if (isEdit) {
        res = await API.put(`/classes/${id}`, payload);
      } else {
        res = await API.post('/classes', payload);
      }

      if (res.success) {
        UI.showToast(isEdit ? 'Class updated successfully' : 'Class created successfully', 'success');
        closeModal();
        loadClasses();
      }
    } catch (err) {
      UI.showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Bind events
  document.getElementById('btn-add-class').onclick = openAddModal;
  document.getElementById('class-modal-close').onclick = closeModal;
  document.getElementById('class-modal-cancel').onclick = closeModal;

  searchInput.oninput = () => renderClassesTable();

  await loadClasses();
});
