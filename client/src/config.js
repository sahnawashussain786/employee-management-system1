const API_BASE = '';

export const api = {
  get: (path, options = {}) =>
    fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }).then((res) =>
      res.json().then((data) => {
        if (!res.ok) {
          const error = new Error(data.error?.message || 'Request failed');
          error.status = res.status;
          error.data = data;
          throw error;
        }
        return data;
      })
    ),

  post: (path, body, options = {}) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
      ...options,
    }).then((res) =>
      res.json().then((data) => {
        if (!res.ok) {
          const error = new Error(data.error?.message || 'Request failed');
          error.status = res.status;
          error.data = data;
          throw error;
        }
        return data;
      })
    ),

  patch: (path, body, options = {}) =>
    fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
      ...options,
    }).then((res) =>
      res.json().then((data) => {
        if (!res.ok) {
          const error = new Error(data.error?.message || 'Request failed');
          error.status = res.status;
          error.data = data;
          throw error;
        }
        return data;
      })
    ),

  delete: (path, options = {}) =>
    fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }).then((res) =>
      res.json().then((data) => {
        if (!res.ok) {
          const error = new Error(data.error?.message || 'Request failed');
          error.status = res.status;
          error.data = data;
          throw error;
        }
        return data;
      })
    ),
};
