import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaHeartbeat, FaEnvelope, FaIdCard, FaKey, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';

function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot_request' | 'forgot_verify' | 'forgot_reset'
  const [loading, setLoading] = useState(false);

  // Form Field States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration States
  const [name, setName] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Forgot Password States
  const [resetEmail, setResetEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Initialize persistent user database in localStorage
  useEffect(() => {
    const existingUsers = localStorage.getItem('clinicianUsers');
    if (!existingUsers) {
      const defaultUsers = [
        {
          name: 'Dr. Pat',
          email: 'doctor@chestxray.ai',
          password: 'clinical2026',
          licenseId: 'MD-999999'
        }
      ];
      localStorage.setItem('clinicianUsers', JSON.stringify(defaultUsers));
    }
  }, []);

  const getUsers = () => {
    const usersJson = localStorage.getItem('clinicianUsers');
    return usersJson ? JSON.parse(usersJson) : [];
  };

  const saveUsers = (users) => {
    localStorage.setItem('clinicianUsers', JSON.stringify(users));
  };

  // Sign In / Login Form Submission Handler
  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in both fields.');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // Simulate authenticating against local clinician storage
    setTimeout(() => {
      const users = getUsers();
      const matchedUser = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password.trim()
      );

      if (matchedUser) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('clinicianEmail', matchedUser.email);
        toast.success(`Welcome back, ${matchedUser.name}!`);
        onLogin();
      } else {
        toast.error('Invalid email or password credentials.');
        setLoading(false);
      }
    }, 1000);
  };

  // Sign Up / Registration Form Submission Handler
  const handleSignUp = (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !licenseId.trim() || !signupPassword.trim() || !confirmPassword.trim()) {
      toast.error('Please fill in all registration fields.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const userExists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

      if (userExists) {
        toast.error('This email is already registered.');
        setLoading(false);
        return;
      }

      const newUser = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: signupPassword.trim(),
        licenseId: licenseId.trim()
      };

      users.push(newUser);
      saveUsers(users);

      toast.success('Clinical account registered successfully!');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('clinicianEmail', newUser.email);
      onLogin();
    }, 1000);
  };

  // Forgot Password Request Handler (Generate simulated OTP)
  const handleForgotRequest = (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const userExists = users.some((u) => u.email.toLowerCase() === resetEmail.trim().toLowerCase());

      if (!userExists) {
        toast.error('No registered clinical account found with this email.');
        setLoading(false);
        return;
      }

      // Generate 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Display simulation OTP toast
      toast.info(`🔐 Clinical Security Code: ${otp}`, { autoClose: 10000 });
      setLoading(false);
      setMode('forgot_verify');
    }, 1200);
  };

  // OTP Code Verification Handler
  const handleForgotVerify = (e) => {
    e.preventDefault();

    if (!enteredOtp.trim()) {
      toast.error('Please enter the verification code.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp) {
      toast.error('Invalid verification code. Please check the code and retry.');
      return;
    }

    toast.success('Identity verified. Please set your new password.');
    setMode('forgot_reset');
  };

  // Password Reset Submission Handler
  const handleForgotReset = (e) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      toast.error('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const userIdx = users.findIndex((u) => u.email.toLowerCase() === resetEmail.toLowerCase());

      if (userIdx === -1) {
        toast.error('Reset failed. Account not found.');
        setLoading(false);
        return;
      }

      users[userIdx].password = newPassword.trim();
      saveUsers(users);

      toast.success('Password updated successfully. Please sign in.');
      setLoading(false);

      // Return to sign in view
      setEmail(resetEmail);
      setPassword('');
      setMode('login');
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-bg-grid"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrapper">
            <FaHeartbeat className="login-logo-icon" />
          </div>
          {mode === 'login' && (
            <>
              <h2>Clinician Login</h2>
              <p>Chest X-Ray Diagnostic AI Workspace</p>
            </>
          )}
          {mode === 'signup' && (
            <>
              <h2>Create Account</h2>
              <p>Register clinician workspace credentials</p>
            </>
          )}
          {mode === 'forgot_request' && (
            <>
              <h2>Forgot Password</h2>
              <p>Request OTP reset verification code</p>
            </>
          )}
          {mode === 'forgot_verify' && (
            <>
              <h2>Verify OTP Code</h2>
              <p>Enter the 6-digit code sent to your email</p>
            </>
          )}
          {mode === 'forgot_reset' && (
            <>
              <h2>Reset Password</h2>
              <p>Create a secure new password for your account</p>
            </>
          )}
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-form-group">
              <label><FaEnvelope className="input-icon" /> Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@chestxray.ai"
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-form-group">
              <label><FaLock className="input-icon" /> Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner"></span> : 'Authenticate'}
            </button>

            <div className="auth-links">
              <button type="button" className="auth-link-btn" onClick={() => { setMode('forgot_request'); setResetEmail(''); }}>
                Forgot Password?
              </button>
              <button type="button" className="auth-link-btn" onClick={() => { setMode('signup'); setName(''); setLicenseId(''); setSignupPassword(''); setConfirmPassword(''); }}>
                Register Account
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="login-form">
            <div className="login-form-group">
              <label><FaUser className="input-icon" /> Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Alexander Fleming"
                disabled={loading}
                required
              />
            </div>

            <div className="login-form-group">
              <label><FaEnvelope className="input-icon" /> Clinical Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@chestxray.ai"
                disabled={loading}
                required
              />
            </div>

            <div className="login-form-group">
              <label><FaIdCard className="input-icon" /> Clinical License ID</label>
              <input
                type="text"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                placeholder="MD-123456"
                disabled={loading}
                required
              />
            </div>

            <div className="login-form-group">
              <label><FaLock className="input-icon" /> Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  disabled={loading}
                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                >
                  {showSignupPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="login-form-group">
              <label><FaLock className="input-icon" /> Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner"></span> : 'Register & Sign In'}
            </button>

            <div className="auth-links">
              <button type="button" className="auth-link-btn" onClick={() => { setMode('login'); }}>
                <FaArrowLeft /> Already registered? Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_request' && (
          <form onSubmit={handleForgotRequest} className="login-form">
            <div className="login-form-group">
              <label><FaEnvelope className="input-icon" /> Clinical Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="doctor@chestxray.ai"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner"></span> : 'Send OTP Verification Code'}
            </button>

            <div className="auth-links">
              <button type="button" className="auth-link-btn" onClick={() => setMode('login')}>
                <FaArrowLeft /> Back to Login
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_verify' && (
          <form onSubmit={handleForgotVerify} className="login-form">
            <div className="login-form-group">
              <label><FaKey className="input-icon" /> OTP Verification Code</label>
              <input
                type="text"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="123456"
                maxLength="6"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              Verify & Proceed
            </button>

            <div className="auth-links">
              <button type="button" className="auth-link-btn" onClick={() => setMode('forgot_request')}>
                <FaArrowLeft /> Resend Code
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_reset' && (
          <form onSubmit={handleForgotReset} className="login-form">
            <div className="login-form-group">
              <label><FaLock className="input-icon" /> New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="login-form-group">
              <label><FaLock className="input-icon" /> Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  disabled={loading}
                  aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner"></span> : 'Reset Password & Sign In'}
            </button>

            <div className="auth-links">
              <button type="button" className="auth-link-btn" onClick={() => setMode('login')}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p className="safety-warning">
            ⚠️ Clinician authentication is required for secure workspace access.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
