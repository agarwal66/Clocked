import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, error, isLoading, clearError, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    console.log('Submitting login with:', identifier);
    
    try {
      await login({ identifier, password });
      console.log('Login successful, redirecting to dashboard...');
      // Immediate redirect after successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by AuthContext
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    // This would call to forgot password API
    console.log('Forgot password for:', forgotEmail);
    setResetSuccess(true);
  };

  const handleClearStorage = () => {
    console.log('Clearing localStorage for fresh login...');
    localStorage.removeItem('clocked_token');
    localStorage.removeItem('clocked_user');
    localStorage.removeItem('clocked_admin_token');
    window.location.reload();
  };

  const handleBackToLogin = () => {
    setShowForgot(false);
    setResetSuccess(false);
    setForgotEmail('');
    clearError();
  };

  if (showForgot) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="logo">
                <span className="flag flag-r"></span>
                <span className="flag flag-g"></span>
                <h1>Clocked</h1>
              </div>
              <h2>Reset Password</h2>
              <p>Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            {!resetSuccess ? (
              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="form-group">
                  <label htmlFor="forgotEmail">Email Address</label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button type="submit" className="login-btn">
                  Send Reset Link
                </button>
              </form>
            ) : (
              <div className="reset-success">
                <div className="success-icon">✓</div>
                <h3>Reset Link Sent!</h3>
                <p>We've sent a password reset link to <strong>{forgotEmail}</strong></p>
                <p>Check your email and click the link to reset your password.</p>
              </div>
            )}

            <div className="form-footer">
              <button onClick={handleBackToLogin} className="back-btn">
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <span className="flag flag-r"></span>
              <span className="flag flag-g"></span>
              <h1>Clocked</h1>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier">Email or Username</label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="form-footer">
            <button 
              type="button" 
              className="forgot-link"
              onClick={() => setShowForgot(true)}
            >
              Forgot your password?
            </button>
            
            <button 
              type="button" 
              className="forgot-link"
              onClick={handleClearStorage}
              style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}
            >
              Login as different user
            </button>
            
            <div className="signup-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
