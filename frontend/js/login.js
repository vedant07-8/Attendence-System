/**
 * Login Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // If user is already authenticated, redirect straight to their dashboard
  if (Auth.isAuthenticated()) {
    const user = Auth.getUser();
    if (user && user.role) {
      window.location.href = CONFIG.DEFAULT_REDIRECTS[user.role] || '/admin/dashboard.html';
      return;
    }
  }

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Check URL params for session notices
  const params = new URLSearchParams(window.location.search);
  if (params.get('session_expired')) {
    UI.showToast('Your session has expired. Please sign in again.', 'info');
  } else if (params.get('logout')) {
    UI.showToast('You have signed out successfully.', 'success');
  }

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('btn-login-submit');
  const submitText = document.getElementById('btn-login-text');
  const spinner = document.getElementById('login-spinner');
  const errorAlert = document.getElementById('login-error');
  const errorText = document.getElementById('login-error-text');

  // Quick Demo Auto-Fill Handlers
  document.getElementById('demo-admin').onclick = () => {
    emailInput.value = 'admin@college.edu';
    passwordInput.value = 'password123';
    errorAlert.style.display = 'none';
  };

  document.getElementById('demo-faculty').onclick = () => {
    emailInput.value = 'alan.turing@college.edu';
    passwordInput.value = 'password123';
    errorAlert.style.display = 'none';
  };

  document.getElementById('demo-student').onclick = () => {
    emailInput.value = 'ishaan.sharma5@student.edu';
    passwordInput.value = 'password123';
    errorAlert.style.display = 'none';
  };

  const setLoading = (loading) => {
    submitBtn.disabled = loading;
    submitText.style.display = loading ? 'none' : 'inline';
    spinner.style.display = loading ? 'inline-block' : 'none';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      errorText.textContent = 'Please provide both email and password';
      errorAlert.style.display = 'flex';
      return;
    }

    try {
      setLoading(true);

      const res = await API.post('/auth/login', { email, password });

      if (res.success && res.token && res.user) {
        Auth.setSession(res.token, res.user);

        // Check if redirect query param exists
        const redirectUrl = params.get('redirect');
        if (redirectUrl && !redirectUrl.includes('index.html')) {
          window.location.href = redirectUrl;
        } else {
          window.location.href = CONFIG.DEFAULT_REDIRECTS[res.user.role] || '/admin/dashboard.html';
        }
      }
    } catch (err) {
      errorText.textContent = err.message || 'Login failed. Please verify credentials.';
      errorAlert.style.display = 'flex';
    } finally {
      setLoading(false);
    }
  };
});
