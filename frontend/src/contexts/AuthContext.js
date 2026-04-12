import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../api/auth';

const initialState = {
  user: null,
  token: localStorage.getItem('clocked_token'),
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    default:
      return state;
  }
};

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('clocked_token');
      // Only auto-login if not on login page (to allow fresh login)
      const isLoginPage = window.location.pathname === '/login';
      // Check if auto-login is prevented
      const preventAutoLogin = sessionStorage.getItem('preventAutoLogin') === 'true';
      
      if (token && !isLoginPage && !preventAutoLogin) {
        try {
          console.log('Auto-login: Found token, validating and logging in...');
          
          // Validate token and get fresh user data
          const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user: userData.user, token }
            });
            // Store fresh user data
            localStorage.setItem('clocked_user', JSON.stringify(userData.user));
          } else {
            // Token is invalid, clear it
            throw new Error('Token validation failed');
          }
        } catch (error) {
          console.log('Token validation failed, clearing auth data');
          localStorage.removeItem('clocked_token');
          localStorage.removeItem('clocked_user');
          dispatch({ type: 'LOGOUT' });
        }
      }
    };
    
    initAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      console.log('AuthContext: Calling login with credentials:', credentials);
      const response = await authAPI.login(credentials.identifier, credentials.password);
      console.log('AuthContext: Login response:', response);
      
      // Store token and user data
      localStorage.setItem('clocked_token', response.token);
      localStorage.setItem('clocked_user', JSON.stringify(response.user));
      console.log('AuthContext: Token and user stored in localStorage');
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
      console.log('AuthContext: Login success dispatched');
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const loginWithToken = (user, token) => {
    // Store token and user data directly (for after signup)
    localStorage.setItem('clocked_token', token);
    localStorage.setItem('clocked_user', JSON.stringify(user));
    
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: user,
        token: token,
      },
    });
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.register(userData);
      
      // Store token and user data
      localStorage.setItem('clocked_token', response.token);
      localStorage.setItem('clocked_user', JSON.stringify(response.user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out user...');
    // Clear all authentication data
    localStorage.removeItem('clocked_token');
    localStorage.removeItem('clocked_user');
    // Clear any other auth-related data
    localStorage.removeItem('clocked_admin_token');
    // Reset auth state
    dispatch({ type: 'LOGOUT' });
    console.log('User logged out successfully');
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login,
    loginWithToken,
    register,
    logout,
    clearError,
    setUser: (userData) => dispatch({ type: 'SET_USER', payload: userData }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
