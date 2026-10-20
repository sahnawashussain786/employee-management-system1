import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';
import { api as rawApi } from '../config';

export function useApi() {
  const { token, isAuthenticated } = useAuth();

  const api = useCallback(
    (path, options = {}) => {
      const headers = {
        ...options.headers,
      };
      if (token && options.auth !== false) {
        headers.Authorization = `Bearer ${token}`;
      }
      return rawApi.get(path, { ...options, headers });
    },
    [token]
  );

  const post = useCallback(
    (path, body, options = {}) => {
      const headers = {
        ...options.headers,
      };
      if (token && options.auth !== false) {
        headers.Authorization = `Bearer ${token}`;
      }
      return rawApi.post(path, body, { ...options, headers });
    },
    [token]
  );

  const patch = useCallback(
    (path, body, options = {}) => {
      const headers = {
        ...options.headers,
      };
      if (token && options.auth !== false) {
        headers.Authorization = `Bearer ${token}`;
      }
      return rawApi.patch(path, body, { ...options, headers });
    },
    [token]
  );

  const del = useCallback(
    (path, options = {}) => {
      const headers = {
        ...options.headers,
      };
      if (token && options.auth !== false) {
        headers.Authorization = `Bearer ${token}`;
      }
      return rawApi.delete(path, { ...options, headers });
    },
    [token]
  );

  return { get: api, post, patch, delete: del };
}
