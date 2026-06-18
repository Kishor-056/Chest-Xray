import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaHome, FaImage, FaChartBar, FaFlask, FaFileAlt, 
  FaCog, FaHistory, FaLayerGroup, FaHeartbeat, FaBars, FaTimes
} from 'react-icons/fa';

// Import components
import Dashboard from './components/Dashboard';
import PredictionPanel from './components/PredictionPanel';
import BatchProcessing from './components/BatchProcessing';
import ModelComparison from './components/ModelComparison';
import GradCAMViewer from './components/GradCAMViewer';
import ClinicalReports from './components/ClinicalReports';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import History from './components/History';

import { healthCheck, MODEL_OPTIONS } from './services/api';
import './styles/App.css';

function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkSystemHealth();

    // Listen for settings updates to re-check connection immediately
    const handleSettingsUpdate = () => {
      console.log('Settings updated, re-checking connection...');
      checkSystemHealth();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    const interval = setInterval(checkSystemHealth, 30000); // Check every 30s
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
      clearInterval(interval);
    };
  }, []);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await healthCheck();
      setSystemStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('System health check failed:', error);
      // Attempt to get the attempted URL for the error message
      const attemptedUrl = error.config?.baseURL || 'the backend';
      toast.error(`Cannot connect to ${attemptedUrl}. Please check your Settings.`);
      setSystemStatus(null);
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <Router>
      <div className="app">
        <ToastContainer position="top-right" autoClose={3000} />
        
        {/* Mobile Toggle Button */}
        <button className="mobile-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Sidebar Navigation */}
        <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <FaHeartbeat className="logo-icon" />
            <h2>Chest X-Ray AI</h2>
            <div className="status-indicator">
              <span className={`status-dot ${systemStatus?.status === 'healthy' ? 'online' : 'offline'}`}></span>
              <div className="status-info">
                <span className="status-text">
                  {systemStatus?.status === 'healthy' ? 'Online' : 'Offline'}
                </span>
                {!systemStatus && (
                  <small className="attempted-url">
                    {localStorage.getItem('appSettings') ? JSON.parse(localStorage.getItem('appSettings')).apiUrl : 'http://192.168.1.15:8000'}
                  </small>
                )}
              </div>
              <button
                className="recheck-btn"
                onClick={(e) => { e.preventDefault(); checkSystemHealth(); }}
                title="Re-check connection"
                disabled={loading}
              >
                ↻
              </button>
            </div>
          </div>

          <ul className="nav-menu">
            <li>
              <Link to="/" className="nav-link" onClick={closeSidebar}>
                <FaHome /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/predict" className="nav-link" onClick={closeSidebar}>
                <FaImage /> Single Prediction
              </Link>
            </li>
            <li>
              <Link to="/batch" className="nav-link" onClick={closeSidebar}>
                <FaLayerGroup /> Batch Processing
              </Link>
            </li>
            <li>
              <Link to="/compare" className="nav-link" onClick={closeSidebar}>
                <FaFlask /> Model Comparison
              </Link>
            </li>
            <li>
              <Link to="/gradcam" className="nav-link" onClick={closeSidebar}>
                <FaChartBar /> GradCAM Viewer
              </Link>
            </li>
            <li>
              <Link to="/reports" className="nav-link" onClick={closeSidebar}>
                <FaFileAlt /> Clinical Reports
              </Link>
            </li>
            <li>
              <Link to="/analytics" className="nav-link" onClick={closeSidebar}>
                <FaChartBar /> Analytics
              </Link>
            </li>
            <li>
              <Link to="/history" className="nav-link" onClick={closeSidebar}>
                <FaHistory /> History
              </Link>
            </li>
            <li>
              <Link to="/settings" className="nav-link" onClick={closeSidebar}>
                <FaCog /> Settings
              </Link>
            </li>
          </ul>

          <div className="sidebar-footer">
            <div className="system-info">
              <p><strong>Models:</strong> {systemStatus?.models_loaded || MODEL_OPTIONS.length}</p>
              <p><strong>Classes:</strong> {systemStatus?.classes || 4}</p>
              <p><strong>Device:</strong> {systemStatus?.device || 'cuda'}</p>
            </div>
          </div>
        </nav>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

        {/* Main Content Area */}
        <main className="main-content">
          {loading ? (
            <div className="loading-screen">
              <div className="spinner"></div>
              <p>Connecting to AI Backend...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/predict" element={<PredictionPanel />} />
              <Route path="/batch" element={<BatchProcessing />} />
              <Route path="/compare" element={<ModelComparison />} />
              <Route path="/gradcam" element={<GradCAMViewer />} />
              <Route path="/reports" element={<ClinicalReports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
