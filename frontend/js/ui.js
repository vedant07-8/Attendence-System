/**
 * UI Utilities: Toasts, Modals, Formatters & Helpers
 */

const UI = {
  /**
   * Display floating toast notification
   * @param {string} message 
   * @param {'success'|'error'|'info'} type 
   * @param {number} duration 
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  },

  /**
   * Custom Confirm Modal dialog
   */
  confirm({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmClass = 'btn-primary', onConfirm }) {
    let modalBackdrop = document.getElementById('confirm-modal-backdrop');
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'confirm-modal-backdrop';
      modalBackdrop.className = 'modal-backdrop';
      document.body.appendChild(modalBackdrop);
    }

    modalBackdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div class="modal-title">${this.escapeHtml(title)}</div>
          <button class="btn-icon-only" id="modal-close-x" aria-label="Close">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">${this.escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="btn ${confirmClass}" id="modal-confirm-btn">${this.escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    modalBackdrop.classList.add('active');
    if (window.lucide) window.lucide.createIcons();

    const cleanup = () => {
      modalBackdrop.classList.remove('active');
      modalBackdrop.innerHTML = '';
    };

    document.getElementById('modal-close-x').onclick = cleanup;
    document.getElementById('modal-cancel-btn').onclick = cleanup;
    document.getElementById('modal-confirm-btn').onclick = () => {
      cleanup();
      if (typeof onConfirm === 'function') onConfirm();
    };
  },

  formatDate(dateInput) {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  formatPercentage(val) {
    const num = Number(val) || 0;
    return `${num.toFixed(1)}%`;
  },

  getAttendanceBadge(percentage) {
    const p = Number(percentage) || 0;
    if (p >= 75) {
      return `<span class="badge badge-present"><i data-lucide="check"></i> ${p.toFixed(1)}%</span>`;
    }
    return `<span class="badge badge-absent"><i data-lucide="alert-circle"></i> ${p.toFixed(1)}% (Defaulter)</span>`;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.UI = UI;
