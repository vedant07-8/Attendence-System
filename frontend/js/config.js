/**
 * Global Configuration for Frontend
 */
const CONFIG = {
  API_BASE_URL: '/api',
  TOKEN_KEY: 'sams_auth_token',
  USER_KEY: 'sams_user_data',
  ROLES: {
    ADMIN: 'admin',
    FACULTY: 'faculty',
    STUDENT: 'student'
  },
  DEFAULT_REDIRECTS: {
    admin: '/admin/dashboard.html',
    faculty: '/faculty/dashboard.html',
    student: '/student/dashboard.html'
  }
};

window.CONFIG = CONFIG;
