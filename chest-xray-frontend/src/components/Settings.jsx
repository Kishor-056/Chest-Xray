import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaSave, FaRedo, FaCheckCircle, FaCog, FaServer, 
  FaPalette, FaCommentMedical, FaInfoCircle, FaLink, FaDatabase 
} from 'react-icons/fa';
import { switchModel, submitFeedback, getModels, MODEL_OPTIONS, TOTAL_ENDPOINTS, getDefaultApiUrl } from '../services/api';

function Settings() {
  const [defaultModel, setDefaultModel] = useState('ensemble');
  const [availableModels, setAvailableModels] = useState([]);
  const [feedback, setFeedback] = useState({
    predictionId: '',
    correctLabel: '',
    confidence: '',
    notes: ''
  });
  const [apiUrl, setApiUrl] = useState(getDefaultApiUrl());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableModels();
    loadSettings();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const response = await getModels();
      setAvailableModels(response.data.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadSettings = () => {
    // Load from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      let currentApiUrl = settings.apiUrl;
      if (currentApiUrl && (currentApiUrl.includes('192.168.1.15') || currentApiUrl.includes('ngrok-free.dev'))) {
        currentApiUrl = getDefaultApiUrl();
        settings.apiUrl = currentApiUrl;
        localStorage.setItem('appSettings', JSON.stringify(settings));
      }
      setDefaultModel(settings.defaultModel || 'ensemble');
      setApiUrl(currentApiUrl || getDefaultApiUrl());
      setAutoRefresh(settings.autoRefresh || false);
      setTheme(settings.theme || 'light');
    }
  };

  const handleSaveSettings = () => {
    const settings = {
      defaultModel,
      apiUrl: apiUrl.trim().replace(/\/$/, ''), // Clean URL
      autoRefresh,
      theme
    };

    localStorage.setItem('appSettings', JSON.stringify(settings));

    // Notify App component to refresh connection
    window.dispatchEvent(new CustomEvent('settingsUpdated'));

    toast.success('Settings saved successfully!');
  };

  const handleSwitchModel = async () => {
    setLoading(true);
    try {
      await switchModel(defaultModel);
      toast.success(`Default model switched to ${defaultModel}`);
    } catch (error) {
      console.error('Failed to switch model:', error);
      toast.error('Failed to switch model');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.predictionId || !feedback.correctLabel) {
      toast.error('Please provide the prediction ID and correct diagnosis');
      return;
    }

    setLoading(true);
    try {
      const confidenceValue = feedback.confidence !== ''
        ? Number(feedback.confidence)
        : undefined;

      if (confidenceValue !== undefined && (Number.isNaN(confidenceValue) || confidenceValue < 0 || confidenceValue > 1)) {
        toast.error('Confidence must be a number between 0 and 1');
        setLoading(false);
        return;
      }

      await submitFeedback({
        predictionId: feedback.predictionId.trim(),
        correctLabel: feedback.correctLabel.trim(),
        confidence: confidenceValue,
        notes: feedback.notes.trim() || undefined,
      });

      toast.success('Feedback submitted successfully!');
      setFeedback({
        predictionId: '',
        correctLabel: '',
        confidence: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    localStorage.removeItem('appSettings');
    setDefaultModel('ensemble');
    setApiUrl(getDefaultApiUrl());
    setAutoRefresh(false);
    setTheme('light');
    toast.info('Settings reset to defaults');
  };

  const displayedAvailableModels = (availableModels.length ? availableModels : MODEL_OPTIONS).map((model) => {
    if (typeof model === 'string') {
      const match = MODEL_OPTIONS.find((option) => option.id === model || option.name === model);
      return {
        id: model,
        name: match?.name || model,
        description: match?.description,
      };
    }

    return {
      id: model.id || model.name,
      name: model.name || model.id,
      description: model.description,
    };
  });

  return (
    <div className="settings">
      <div className="panel-header">
        <h1>Settings & Configuration</h1>
        <p>Configure default classification parameters, API servers, appearances, and feedback</p>
      </div>

      <div className="settings-grid">
        {/* Left Column: Core Configuration */}
        <div className="settings-col">
          {/* Model Settings Card */}
          <div className="settings-card model-settings-card">
            <div className="card-header-with-icon">
              <FaCog className="header-icon" />
              <div>
                <h2>Model Preferences</h2>
                <p>Configure the default AI neural classifier model</p>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label>Default AI Network Model</label>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                style={{ width: '100%' }}
              >
                {MODEL_OPTIONS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} — {model.description}
                  </option>
                ))}
              </select>
              <button
                className="btn-secondary"
                onClick={handleSwitchModel}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                Apply Model Switch
              </button>
            </div>

            {displayedAvailableModels.length > 0 && (
              <div className="available-models">
                <h4>Active Server Models ({displayedAvailableModels.length})</h4>
                <div className="models-list">
                  {displayedAvailableModels.map((model) => (
                    <div key={model.id} className="model-item">
                      <FaCheckCircle className="check-icon" />
                      <span>
                        <strong style={{ display: 'inline', color: '#374151', fontSize: '13px' }}>{model.name}</strong>
                        {model.description && (
                          <small className="model-description">{model.description}</small>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* API Server Card */}
          <div className="settings-card api-settings-card">
            <div className="card-header-with-icon">
              <FaServer className="header-icon" />
              <div>
                <h2>API Network Configuration</h2>
                <p>Configure server connection and communication hosts</p>
              </div>
            </div>

            <div className="form-group">
              <label>Backend API Base URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={getDefaultApiUrl()}
              />
              <small>Specify the network URL mapping to your server endpoint</small>
            </div>

            <div className="form-group checkbox-group" style={{ margin: 0 }}>
              <label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh system status (every 30 seconds)
              </label>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="settings-card appearance-card">
            <div className="card-header-with-icon">
              <FaPalette className="header-icon" />
              <div>
                <h2>Appearance Options</h2>
                <p>Customize the visual UI theme of the workspace</p>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Theme Choice</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light Mode (Clean White)</option>
                <option value="dark">Dark Mode (Sleek Slate)</option>
                <option value="auto">Auto (Match System Preferences)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Feedback & System Info */}
        <div className="settings-col">
          {/* Feedback Card */}
          <div className="settings-card feedback-card">
            <div className="card-header-with-icon">
              <FaCommentMedical className="header-icon" />
              <div>
                <h2>Clinical Feedback Portal</h2>
                <p>Provide diagnostic feedback to train the AI neural classifier</p>
              </div>
            </div>

            <div className="form-group">
              <label>Model Prediction ID</label>
              <input
                type="text"
                value={feedback.predictionId}
                onChange={(e) => setFeedback({ ...feedback, predictionId: e.target.value })}
                placeholder="e.g. pred_8f5da02a"
              />
            </div>

            <div className="form-group">
              <label>Correct Clinical Diagnosis</label>
              <input
                type="text"
                value={feedback.correctLabel}
                onChange={(e) => setFeedback({ ...feedback, correctLabel: e.target.value })}
                placeholder="e.g. Pneumonia, Normal"
              />
            </div>

            <div className="form-group">
              <label>Diagnosis Confidence (0.00 — 1.00)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={feedback.confidence}
                onChange={(e) => setFeedback({ ...feedback, confidence: e.target.value })}
                placeholder="e.g. 0.95"
              />
            </div>

            <div className="form-group">
              <label>Clinical Notes</label>
              <textarea
                value={feedback.notes}
                onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                placeholder="Details of structural abnormalities, consolidated regions, opacity patterns..."
                rows={4}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmitFeedback}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '15px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
                transition: 'all 0.2s',
                border: 'none'
              }}
            >
              Submit Diagnostic Feedback
            </button>
          </div>

          {/* Diagnostic Info Card */}
          <div className="settings-card sysinfo-card">
            <div className="card-header-with-icon">
              <FaInfoCircle className="header-icon" />
              <div>
                <h2>System & Diagnostic Info</h2>
                <p>Technical metrics of the application stack</p>
              </div>
            </div>

            <div className="system-info-grid">
              <div className="info-row">
                <span className="info-label"><FaLink style={{ marginRight: 6, color: '#3b82f6' }} /> Frontend Version:</span>
                <span className="info-value">1.0.0</span>
              </div>
              <div className="info-row">
                <span className="info-label"><FaDatabase style={{ marginRight: 6, color: '#10b981' }} /> Total Endpoints:</span>
                <span className="info-value">{TOTAL_ENDPOINTS} Active API Points</span>
              </div>
              <div className="info-row">
                <span className="info-label">Available Classifier Models:</span>
                <span className="info-value">{MODEL_OPTIONS.length} Models Loaded</span>
              </div>
              <div className="info-row">
                <span className="info-label">API Server Status:</span>
                <span className="info-value status-online">Connected</span>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="settings-card about-section">
            <div className="card-header-with-icon">
              <FaInfoCircle className="header-icon" style={{ color: '#64748b', background: '#f1f5f9' }} />
              <div>
                <h2>About Project</h2>
                <p>AI Chest X-Ray diagnostic workspace</p>
              </div>
            </div>
            <p>
              <strong>Chest X-Ray AI Analysis Workspace</strong> is a complete clinical imaging processing platform incorporating {TOTAL_ENDPOINTS} network API endpoints and {MODEL_OPTIONS.length} deep neural network models.
            </p>
            <p>
              Integrated features: Single image predictions, GradCAM heatmaps, batch pipelines, model benchmarking, automated clinical reports, and structured RAG-enhanced diagnostic databases.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button className="btn-save" onClick={handleSaveSettings}>
          <FaSave /> Save Workspace Settings
        </button>
        <button className="btn-reset" onClick={handleResetSettings}>
          <FaRedo /> Reset Settings to Defaults
        </button>
      </div>
    </div>
  );
}

export default Settings;
