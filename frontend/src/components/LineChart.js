import { Line } from "react-chartjs-2";
import { Typography, Paper, Box } from "@mui/material";
import {
  Chart,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

Chart.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
  Legend
);

const LineChart = ({ title, data }) => {
  // Format timestamps for display with full date and time
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      return timestamp;
    }
  };

  const chartData = {
    labels: data.map((d) => formatTimestamp(d.timestamp)),
    datasets: [
      {
        label: title,
        data: data.map((d) => d.value),
        borderColor: title.includes("Password") ? "#ff9800" : "#4caf50",
        backgroundColor: title.includes("Password")
          ? "rgba(255, 152, 0, 0.1)"
          : "rgba(76, 175, 80, 0.1)",
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            if (title.includes("Password")) {
              return `Password Check: ${value === 1 ? "Success" : "Failed"}`;
            } else {
              return `PIR Detection: ${
                value === 1 ? "Detected" : "No Detection"
              }`;
            }
          },
          title: function (context) {
            const dataPoint = data[context[0].dataIndex];
            return formatTimestamp(dataPoint.timestamp);
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Time (Day/Month/Year Hour:Min:Sec)",
        },
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: title.includes("Password")
            ? "Password Check (0=Failed, 1=Success)"
            : "PIR Detection (0=No Detection, 1=Detected)",
        },
        min: 0,
        max: 1.2,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            if (title.includes("Password")) {
              if (value === 0) return "Failed";
              if (value === 1) return "Success";
            } else {
              if (value === 0) return "No Detection";
              if (value === 1) return "Detected";
            }
            return value;
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Last {data.length} data points • Updated in real-time
      </Typography>
      <Box sx={{ height: 300, mt: 2 }}>
        {data.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "text.secondary",
            }}
          >
            Không có dữ liệu để hiển thị
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LineChart;
