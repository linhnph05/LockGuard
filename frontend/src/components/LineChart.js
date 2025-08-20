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
        borderColor: "#4caf50",
        tension: 0.4, // Smooth line
        pointRadius: 6,
        pointHoverRadius: 8,
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
        intersect: false,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            if (title.includes("cửa")) {
              return `Trạng thái cửa: ${value === 1 ? "Mở" : "Đóng"}`;
            } else {
              return `Cảm biến PIR: ${
                value === 1 ? "Phát hiện" : "Không phát hiện"
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
          text: "Thời gian",
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
          text: title.includes("cửa")
            ? "Trạng thái cửa"
            : "Cảm biến PIR",
        },
        min: 0,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            if (title.includes("cửa")) {
              if (value === 0) return "Đóng";
              if (value === 1) return "Mở";
            } else {
              if (value === 0) return "Không phát hiện";
              if (value === 1) return "Phát hiện";
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
        {data.length} điểm dữ liệu gần đây • Cập nhật theo thời gian thực
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
