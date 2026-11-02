/**
 * Authentication Helper & Route Guard
 */

const Auth = {
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getUser() {
    try {
      const data = localStorage.getItem(CONFIG.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  /**
   * Route Guard: Call this at top of protected pages
   * @param {Array<string>} allowedRoles e.g. ['admin'], ['faculty'], or ['student']
   */
  requireAuth(allowedRoles = []) {
    const token = this.getToken();
    const user = this.getUser();

    // Not logged in -> redirect to login
    if (!token || !user) {
      this.clearSession();
      window.location.href = `/index.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    // Role check
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      console.warn(`Unauthorized role '${user.role}' accessing ${window.location.pathname}`);
      // Redirect to user's authorized role dashboard
      const target = CONFIG.DEFAULT_REDIRECTS[user.role] || '/index.html';
      window.location.href = target;
      return false;
    }

    return true;
  },

  logout() {
    this.clearSession();
    window.location.href = '/index.html?logout=true';
  }
};

window.Auth = Auth;
