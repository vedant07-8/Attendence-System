/**
 * Layout Generator: Injects unified professional Sidebar & Topbar
 */

const Layout = {
  adminNav: [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard.html', icon: 'layout-dashboard' }
      ]
    },
    {
      group: 'Academic Directory',
      items: [
        { label: 'Students', href: '/admin/students.html', icon: 'users' },
        { label: 'Faculty', href: '/admin/faculty.html', icon: 'user-check' },
        { label: 'Classes', href: '/admin/classes.html', icon: 'layers' },
        { label: 'Subjects', href: '/admin/subjects.html', icon: 'book-open' }
      ]
    },
    {
      group: 'Attendance & Analytics',
      items: [
        { label: 'Defaulters List', href: '/admin/defaulters.html', icon: 'alert-triangle' },
        { label: 'Monthly Reports', href: '/admin/reports.html', icon: 'bar-chart-3' }
      ]
    }
  ],

  facultyNav: [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', href: '/faculty/dashboard.html', icon: 'layout-dashboard' }
      ]
    },
    {
      group: 'Attendance Operations',
      items: [
        { label: 'Mark Attendance', href: '/faculty/attendance.html', icon: 'check-square' },
        { label: 'Attendance History', href: '/faculty/history.html', icon: 'history' }
      ]
    }
  ],

  studentNav: [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', href: '/student/dashboard.html', icon: 'layout-dashboard' }
      ]
    },
    {
      group: 'Academics',
      items: [
        { label: 'My Subjects', href: '/student/subjects.html', icon: 'book-open' },
        { label: 'Attendance History', href: '/student/history.html', icon: 'calendar' },
        { label: '75% Calculator', href: '/student/calculator.html', icon: 'calculator' }
      ]
    }
  ],

  init(pageTitle = 'Dashboard') {
    const user = Auth.getUser();
    if (!user) return;

    const currentPath = window.location.pathname;
    let navGroups = [];

    if (user.role === 'admin') navGroups = this.adminNav;
    else if (user.role === 'faculty') navGroups = this.facultyNav;
    else if (user.role === 'student') navGroups = this.studentNav;

    // Render Sidebar HTML
    let navHtml = '';
    navGroups.forEach(group => {
      navHtml += `
        <div class="nav-section">
          <div class="nav-section-title">${group.group}</div>
          ${group.items.map(item => {
            const isActive = currentPath.endsWith(item.href) || (item.href.includes('dashboard') && (currentPath.endsWith('/') || currentPath.endsWith('/index.html')));
            return `
              <a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}">
                <i data-lucide="${item.icon}"></i>
                <span>${item.label}</span>
              </a>
            `;
          }).join('')}
        </div>
      `;
    });

    const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    const sidebarHtml = `
      <aside class="app-sidebar" id="app-sidebar">
        <div class="sidebar-header">
          <div class="brand-icon">S</div>
          <div class="brand-details">
            <span class="brand-title">SmartAttendance</span>
            <span class="brand-subtitle">${user.role} Portal</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          ${navHtml}
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile-badge">
            <div class="user-avatar">${userInitial}</div>
            <div class="user-info">
              <div class="user-name" title="${UI.escapeHtml(user.name)}">${UI.escapeHtml(user.name)}</div>
              <div class="user-role-label">${user.role}</div>
            </div>
          </div>
          <button class="btn-sidebar-logout" id="sidebar-logout-btn" title="Sign Out">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </aside>
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
    `;

    const topbarHtml = `
      <header class="app-topbar">
        <div class="topbar-left">
          <button class="btn-menu-toggle" id="btn-menu-toggle" aria-label="Toggle navigation menu">
            <i data-lucide="menu"></i>
          </button>
          <div class="page-title-group">
            <h1 class="page-title">${UI.escapeHtml(pageTitle)}</h1>
          </div>
        </div>
        <div class="topbar-right">
          <span class="badge badge-neutral" style="text-transform: capitalize;">
            <i data-lucide="shield-check"></i> ${user.role}
          </span>
          <button class="btn btn-secondary btn-sm" id="topbar-logout-btn">
            <i data-lucide="log-out"></i>
            <span>Logout</span>
          </button>
        </div>
      </header>
    `;

    // Inject into container
    const layoutContainer = document.getElementById('app-shell');
    if (layoutContainer) {
      const mainContent = document.getElementById('main-content');
      layoutContainer.innerHTML = sidebarHtml;

      const mainWrapper = document.createElement('div');
      mainWrapper.className = 'app-main';
      mainWrapper.innerHTML = topbarHtml;
      
      if (mainContent) {
        mainWrapper.appendChild(mainContent);
      }
      layoutContainer.appendChild(mainWrapper);
    }

    // Attach event listeners
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const toggleBtn = document.getElementById('btn-menu-toggle');

    if (toggleBtn && sidebar && backdrop) {
      toggleBtn.onclick = () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
      };

      backdrop.onclick = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      };
    }

    // Logout handlers
    const logoutHandler = () => {
      UI.confirm({
        title: 'Sign Out',
        message: 'Are you sure you want to end your current session?',
        confirmText: 'Sign Out',
        confirmClass: 'btn-danger',
        onConfirm: () => Auth.logout()
      });
    };

    const sideLogout = document.getElementById('sidebar-logout-btn');
    if (sideLogout) sideLogout.onclick = logoutHandler;

    const topLogout = document.getElementById('topbar-logout-btn');
    if (topLogout) topLogout.onclick = logoutHandler;

    // Render icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

window.Layout = Layout;
