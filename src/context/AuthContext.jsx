/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const userData = await apiFetch("/auth/me");
          setUser(userData);
        } catch (error) {
          console.error("Token invalido o expirado", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };

    checkAuth();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const data = await apiFetch("/auth/login/access-token", {
      method: "POST",
      body: formData,
    });

    localStorage.setItem("token", data.access_token);

    const userData = await apiFetch("/auth/me");
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
