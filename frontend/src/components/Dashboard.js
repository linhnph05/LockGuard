import React, { useEffect, useState } from 'react';
import ChartCard from './Chart';
import { Container } from '@mui/material';
import socket from '../socket';

const Dashboard = () => {
  const [pirData, setPirData] = useState([]);
  const [passwordData, setPasswordData] = useState([]);

  useEffect(() => {
    socket.on('pir', data => setPirData(prev => [...prev.slice(-20), data]));
    socket.on('password', data => setPasswordData(prev => [...prev.slice(-20), data]));
    return () => {
      socket.off('pir');
      socket.off('password');
    };
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <ChartCard title="PIR sensor" data={pirData} />
      <ChartCard title="Lịch sử nhập mk" data={passwordData} />
    </Container>
  );
};

export default Dashboard;
