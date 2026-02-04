

import axios from "axios";
import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://localhost:8000/api/v1/user";

  const signup = async (name, username, password) => {
    try {
      setLoading(true);

      await axios.post(`${API_BASE_URL}/signup`, {
        name,
        username,
        password,
      });

      return { success: true };

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Signup failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });

      setToken(res.data.token);
      setUser(res.data.user);

      localStorage.setItem("token", res.data.token);

      return { success: true };

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ signup, login, logout, user, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
