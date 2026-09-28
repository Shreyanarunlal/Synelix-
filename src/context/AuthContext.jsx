// src/context/AuthContext.jsx
// Holds the signed-in user and the bearer token for the whole app.

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, setUnauthorizedHandler, tokenStore } from "../services/api";
import { AuthContext, ROLE_HOME } from "./authShared";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Any 401 from any call clears the session rather than leaving the UI in a
  // half-authenticated state showing stale data.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Confirm a stored token is still valid before trusting it on page load.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;

    let cancelled = false;

    authApi
      .me()
      .then((result) => {
        if (!cancelled && !result?.authenticated) logout();
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login(email, password);
    tokenStore.set(result.token);
    tokenStore.setUser(result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const result = await authApi.register(name, email, password, role);
    tokenStore.set(result.token);
    tokenStore.setUser(result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      homeFor: (role) => ROLE_HOME[role] || "/",
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
