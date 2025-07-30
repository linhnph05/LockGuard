import React from 'react';
import { Line } from 'react-chartjs-2';
import { Paper, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const ChartCard = ({ title, data }) => {
  const chartData = {
    labels: data.map(d => d.timestamp),
    datasets: [{
      label: title,
      data: data.map(d => d.value),
      borderColor: 'blue',
      tension: 0.3,
    }],
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Line data={chartData} />
    </Paper>
  );
};

export default ChartCard;
