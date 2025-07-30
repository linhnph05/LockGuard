import React, { useState } from 'react';
import { Button, TextField, Paper, Typography } from '@mui/material';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Paper sx={{ padding: 4, width: 300, margin: 'auto', marginTop: 10 }}>
      <Typography variant="h6">Đăng nhập</Typography>
      <TextField fullWidth label="Tài khoản" margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
      <TextField fullWidth label="Mật khẩu" type="password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
      <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => onLogin(username, password)}>Đăng nhập</Button>
    </Paper>
  );
};

export default Login;
