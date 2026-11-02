/**
 * Shared API Fetch Wrapper
 * Automatically sets headers, JWT Authorization, parses JSON, and handles 401 unauth.
 */

const API = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    // If sending FormData, do not set Content-Type header so browser sets boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized / Token Expired
      if (response.status === 401) {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        
        // Only redirect to login if we are not already on login page
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
          window.location.href = '/index.html?session_expired=true';
        }
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `HTTP error ${response.status}`);
        error.status = response.status;
        error.errors = data.errors;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error: ${endpoint}]`, err);
      throw err;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

window.API = API;
