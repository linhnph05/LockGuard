import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (username, password) => {
    // TODO: validate with backend
    if (username === 'admin' && password === '1234') setLoggedIn(true);
  };

  return loggedIn ? <Dashboard /> : <Login onLogin={handleLogin} />;
};

export default App;
