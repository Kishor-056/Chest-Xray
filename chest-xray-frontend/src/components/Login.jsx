import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaHeartbeat } from 'react-icons/fa';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in both fields.');
      return;
    }
    
    // Check format
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // Simulate authenticating against mock clinician credentials
    setTimeout(() => {
      if (email.trim() === 'doctor@chestxray.ai' && password.trim() === 'clinical2026') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('clinicianEmail', email);
        toast.success('Welcome back, Doctor!');
        onLogin();
      } else {
        toast.error('Invalid credentials. Please use the default doctor login.');
        setLoading(false);
      }
    }, 1000); // 1s simulation delay
  };

  return (
    <div className="login-container">
      <div className="login-bg-grid"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrapper">
            <FaHeartbeat className="login-logo-icon" />
          </div>
          <h2>Clinician Login</h2>
          <p>Chest X-Ray Diagnostic AI Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label><FaUser className="input-icon" /> Email Address</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@chestxray.ai"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="login-form-group">
            <label><FaLock className="input-icon" /> Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="login-spinner"></span> : 'Authenticate'}
          </button>
        </form>

        <div className="login-footer">
          <div className="credentials-tip">
            <strong>Demonstration Credentials:</strong>
            <p>Email: <code>doctor@chestxray.ai</code></p>
            <p>Password: <code>clinical2026</code></p>
          </div>
          <p className="safety-warning">
            ⚠️ Clinician authentication is required for secure workspace access.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
