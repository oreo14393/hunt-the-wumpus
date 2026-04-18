import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (token) => {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('wumpus_token');
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('wumpus_token');
    if (token) fetchMe(token);
    else setLoading(false);
  }, [fetchMe]);

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('wumpus_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('wumpus_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('wumpus_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
