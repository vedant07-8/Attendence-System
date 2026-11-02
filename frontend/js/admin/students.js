/**
 * Admin Student Management Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['admin'])) return;
  Layout.init('Manage Students');

  let classes = [];
  let students = [];

  const filterClass = document.getElementById('filter-class');
  const searchInput = document.getElementById('search-student');
  const tbody = document.getElementById('students-table-body');
  const modal = document.getElementById('student-modal-backdrop');
  const form = document.getElementById('student-form');
  const modalTitle = document.getElementById('student-modal-title');
  const studentClassSelect = document.getElementById('student-class');
  const passwordInput = document.getElementById('student-password');
  const passwordHelp = document.getElementById('password-help');

  // Load classes for dropdown
  const loadClasses = async () => {
    try {
      const res = await API.get('/classes');
      if (res.success) {
        classes = res.data;
        filterClass.innerHTML = '<option value="">All Classes</option>' +
          classes.map(c => `<option value="${c._id}">${UI.escapeHtml(c.name)}</option>`).join('');

        studentClassSelect.innerHTML = '<option value="">Select Class</option>' +
          classes.map(c => `<option value="${c._id}">${UI.escapeHtml(c.name)}</option>`).join('');
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  // Load students
  const loadStudents = async () => {
    try {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-loader">
            <div class="spinner"></div> Loading students...
          </td>
        </tr>
      `;

      const classId = filterClass.value;
      const search = searchInput.value.trim();

      const queryParams = new URLSearchParams();
      if (classId) queryParams.set('classId', classId);
      if (search) queryParams.set('search', search);

      const res = await API.get(`/students?${queryParams.toString()}`);
      if (res.success) {
        students = res.data;
        renderStudentsTable();
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--danger); padding: 32px;">
            ${UI.escapeHtml(err.message || 'Failed to load students')}
          </td>
        </tr>
      `;
    }
  };

  const renderStudentsTable = () => {
    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="users"></i></div>
              <div class="empty-state-title">No students found</div>
              <div class="empty-state-desc">Try clearing filters or click "Add New Student" to enroll learners.</div>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = students.map(st => `
      <tr>
        <td><strong style="color: var(--text-primary);">${UI.escapeHtml(st.rollNumber)}</strong></td>
        <td>
          <div style="font-weight: 500; color: var(--text-primary);">${UI.escapeHtml(st.user ? st.user.name : '-')}</div>
        </td>
        <td>${UI.escapeHtml(st.user ? st.user.email : '-')}</td>
        <td>
          <span class="badge badge-neutral">
            ${UI.escapeHtml(st.class ? st.class.name.split('(')[0].trim() : '-')}
          </span>
        </td>
        <td>${UI.escapeHtml(st.phone || '-')}</td>
        <td>
          <span class="badge ${st.user && st.user.isActive ? 'badge-present' : 'badge-absent'}">
            ${st.user && st.user.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${st._id}">
              <i data-lucide="edit-2"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="${st._id}" data-name="${UI.escapeHtml(st.user ? st.user.name : st.rollNumber)}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach row action listeners
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => openEditModal(btn.dataset.id);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = () => handleDelete(btn.dataset.id, btn.dataset.name);
    });
  };

  const openAddModal = () => {
    form.reset();
    document.getElementById('student-id').value = '';
    modalTitle.textContent = 'Add New Student';
    passwordInput.required = true;
    passwordHelp.textContent = '(Min 6 characters)';
    modal.classList.add('active');
  };

  const openEditModal = (id) => {
    const st = students.find(s => s._id === id);
    if (!st) return;

    document.getElementById('student-id').value = st._id;
    document.getElementById('student-name').value = st.user ? st.user.name : '';
    document.getElementById('student-roll').value = st.rollNumber;
    document.getElementById('student-email').value = st.user ? st.user.email : '';
    document.getElementById('student-class').value = st.class ? st.class._id : '';
    document.getElementById('student-phone').value = st.phone || '';

    modalTitle.textContent = `Edit Student: ${st.rollNumber}`;
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
      title: 'Delete Student',
      message: `Are you sure you want to permanently delete student "${name}"? All associated attendance logs will be wiped.`,
      confirmText: 'Delete Student',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await API.delete(`/students/${id}`);
          if (res.success) {
            UI.showToast('Student deleted successfully', 'success');
            loadStudents();
          }
        } catch (err) {
          UI.showToast(err.message || 'Failed to delete student', 'error');
        }
      }
    });
  };

  // Form submit
  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('student-id').value;
    const isEdit = !!id;

    const payload = {
      name: document.getElementById('student-name').value.trim(),
      rollNumber: document.getElementById('student-roll').value.trim(),
      email: document.getElementById('student-email').value.trim(),
      classId: document.getElementById('student-class').value,
      phone: document.getElementById('student-phone').value.trim()
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
        res = await API.put(`/students/${id}`, payload);
      } else {
        res = await API.post('/students', payload);
      }

      if (res.success) {
        UI.showToast(isEdit ? 'Student updated successfully' : 'Student added successfully', 'success');
        closeModal();
        loadStudents();
      }
    } catch (err) {
      UI.showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Bind events
  document.getElementById('btn-add-student').onclick = openAddModal;
  document.getElementById('student-modal-close').onclick = closeModal;
  document.getElementById('student-modal-cancel').onclick = closeModal;

  filterClass.onchange = loadStudents;

  // Debounced search
  let debounceTimer;
  searchInput.oninput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadStudents, 300);
  };

  // Initial load
  await loadClasses();
  await loadStudents();
});
