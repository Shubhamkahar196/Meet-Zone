/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';
import React, { createContext, useContext, useState } from 'react';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component to wrap the app and provide auth state
export const AuthProvider = ({ children }) => {
  // State to hold user data and token
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  
  const API_BASE_URL = 'http://localhost:8000'; 

  // Function to handle user signup
 const signup = async (name, username, password) => {
  setLoading(true);
  setError(null);

  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, {
      name,
      username,
      password,
    });

    return { success: true, message: response.data.message };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    setError(msg);
    return { success: false, message: msg };
  } finally {
    setLoading(false);
  }
};

  // Function to handle user login
  const login = async (username, password) => {
  setLoading(true);
  setError(null);

  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      username,
      password,
    });

    const { token: newToken, user: userData } = response.data;

    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);

    return { success: true, message: response.data.message };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    setError(msg);
    return { success: false, message: msg };
  } finally {
    setLoading(false);
  }
};


  // // Function to handle logout
  // const logout = () => {
  //   setUser(null);
  //   setToken(null);
  //   localStorage.removeItem('token');
  // };

  // // Effect to check for existing token on app load
  // useEffect(() => {
  //   if (token) {
  //     // Optionally, validate token with backend here
     
  //   }
  // }, [token]);

  // Value object to provide to consumers
  const value = {
    user,
    token,
    loading,
    error,
    signup,
    login,
    // logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
