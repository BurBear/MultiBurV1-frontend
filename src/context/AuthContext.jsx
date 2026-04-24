import React, { createContext, useState, useEffect } from 'react';
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
          console.error("Token inválido o expirado", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const data = await apiFetch("/auth/login/access-token", {
      method: "POST",
      body: formData, // Importante: Form-Data para FastAPI OAuth2
    });

    localStorage.setItem("token", data.access_token);
    
    // Obtener info del usuario tras login
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
