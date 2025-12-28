import React, { useState, useEffect } from 'react';
import api from '../services/api';

const GoogleSheetManager = () => {
  const [sheetInfo, setSheetInfo] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [spreadsheetName, setSpreadsheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSheetInfo();
  }, []);

  const fetchSheetInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('⚠️ Please log in to use Google Sheets integration');
        return;
      }
      
      const response = await api.get('/admin/my-sheet');
      if (response.data.success && response.data.hasSheet) {
        setSheetInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching sheet info:', error);
      if (error.response?.status === 401) {
        setMessage('⚠️ Please log in to access this feature');
      }
    }
  };

  const handleSetupSheet = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('⚠️ Please log in first');
        setLoading(false);
        return;
      }

      const response = await api.post('/admin/setup-sheet', {
        spreadsheetId,
        spreadsheetName: spreadsheetName || 'My Inventory'
      });

      if (response.data.success) {
        setMessage('✅ Google Sheet linked successfully!');
        setSpreadsheetId('');
        setSpreadsheetName('');
        // Fetch updated sheet info to refresh the view
        await fetchSheetInfo();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage('⚠️ Please log in to link your Google Sheet');
      } else {
        setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSheet = async () => {
    setUpdating(true);
    setMessage('');

    try {
      const response = await api.post('/admin/update-sheet');
      
      if (response.data.success) {
        setMessage('✅ Sheet updated successfully!');
      }
    } catch (error) {
      if (error.response?.data?.needsSetup) {
        setMessage('⚠️ Please set up your Google Sheet first');
      } else {
        setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDisconnectSheet = async () => {
    if (!window.confirm('Are you sure you want to disconnect this Google Sheet? You can reconnect a different sheet afterwards.')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/admin/disconnect-sheet');
      
      if (response.data.success) {
        setSheetInfo(null);
        setMessage('✅ Sheet disconnected successfully! You can now connect a different sheet.');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractSpreadsheetId = (input) => {
    // Extract ID from URL or use as-is if already an ID
    const urlMatch = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return urlMatch ? urlMatch[1] : input;
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    const id = extractSpreadsheetId(input);
    setSpreadsheetId(id);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Google Sheets Inventory</h2>

      {sheetInfo?.hasSheet ? (
        <div style={styles.sheetInfo}>
          <div style={styles.infoCard}>
            <h3 style={styles.subtitle}>✅ Sheet Connected</h3>
            <p><strong>Name:</strong> {sheetInfo.spreadsheetName}</p>
            <p><strong>ID:</strong> {sheetInfo.spreadsheetId}</p>
            
            <div style={styles.buttonGroup}>
              <a 
                href={sheetInfo.sheetUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.linkButton}
              >
                📖 Open My Sheet
              </a>
              
              <button
                onClick={handleUpdateSheet}
                disabled={updating}
                style={{...styles.button, ...styles.updateButton}}
              >
                {updating ? '⏳ Updating...' : '🔄 Update Now'}
              </button>

              <button
                onClick={handleDisconnectSheet}
                disabled={loading}
                style={{...styles.button, ...styles.disconnectButton}}
              >
                {loading ? '⏳ Disconnecting...' : '🔌 Disconnect'}
              </button>
            </div>
            
            <div style={styles.instructions}>
              <p><strong>💡 How it works:</strong></p>
              <ul>
                <li>Click "Update Now" to sync your database inventory to the sheet</li>
                <li>Your sheet will show all bottles you've scanned</li>
                <li>Organized by product name, MG level, and bottle size</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.setupCard}>
          <h3 style={styles.subtitle}>🔗 Link Your Google Sheet</h3>
          <p>Connect your Google Sheets inventory tracker to automatically sync your bottles.</p>
          
          <form onSubmit={handleSetupSheet} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Spreadsheet URL or ID *</label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={handleInputChange}
                placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                required
                style={styles.input}
              />
              <small style={styles.hint}>
                Paste the full Google Sheets URL or just the spreadsheet ID
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sheet Name (optional)</label>
              <input
                type="text"
                value={spreadsheetName}
                onChange={(e) => setSpreadsheetName(e.target.value)}
                placeholder="My Inventory"
                style={styles.input}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{...styles.button, ...styles.setupButton}}
            >
              {loading ? '⏳ Linking...' : '✅ Link Sheet'}
            </button>
          </form>

          <div style={styles.setupInstructions}>
            <h4>📋 Setup Instructions:</h4>
            <ol>
              <li>Create or open your Google Sheets inventory tracker</li>
              <li>Copy the spreadsheet URL from your browser</li>
              <li>Paste it above and click "Link Sheet"</li>
              <li>Make sure the sheet is shared with the service account email</li>
            </ol>
            <p style={styles.note}>
              <strong>Note:</strong> Your sheet must be shared with editor access to: 
              <code style={styles.code}>inventory-updater@your-project.iam.gserviceaccount.com</code>
            </p>
          </div>
        </div>
      )}

      {message && (
        <div style={message.includes('❌') ? styles.errorMessage : styles.successMessage}>
          {message}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#333',
  },
  subtitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#444',
  },
  sheetInfo: {
    marginTop: '20px',
  },
  infoCard: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #4CAF50',
  },
  setupCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    marginBottom: '15px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  linkButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#2196F3',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  setupButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    width: '100%',
  },
  form: {
    marginTop: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  hint: {
    display: 'block',
    marginTop: '5px',
    color: '#666',
    fontSize: '12px',
  },
  instructions: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px',
  },
  setupInstructions: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    fontSize: '14px',
  },
  note: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fffbea',
    borderLeft: '3px solid #f59e0b',
    fontSize: '12px',
  },
  code: {
    backgroundColor: '#f4f4f4',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  successMessage: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: '6px',
  },
  errorMessage: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
  },
};

export default GoogleSheetManager;
