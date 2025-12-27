import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50',
    },
    secondary: {
      main: '#FFC107',
    },
  },
});

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {user && (
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Vape Inventory Dashboard
              </Typography>
              <Box sx={{ mr: 2 }}>
                <Typography variant="body2">
                  {user.name}
                </Typography>
              </Box>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Toolbar>
          </AppBar>
        )}

        <Routes>
          <Route
            path="/"
            element={
              user ? <Dashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/" replace /> : <Register onLogin={handleLogin} />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
