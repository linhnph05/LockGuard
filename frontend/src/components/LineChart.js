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
  // Format timestamps for display
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
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
        borderColor:
          title.includes("PIR") || title.includes("pir field")
            ? "#4caf50"
            : title.includes("cửa") ||
              title.includes("open.json") ||
              title.includes("success field")
            ? "#2196f3"
            : title.includes("mật khẩu")
            ? "#ff9800"
            : "#9c27b0",
        backgroundColor:
          title.includes("PIR") || title.includes("pir field")
            ? "rgba(76, 175, 80, 0.1)"
            : title.includes("cửa") ||
              title.includes("open.json") ||
              title.includes("success field")
            ? "rgba(33, 150, 243, 0.1)"
            : title.includes("mật khẩu")
            ? "rgba(255, 152, 0, 0.1)"
            : "rgba(156, 39, 176, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
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
            if (title.includes("success field")) {
              return `Success: ${value === 1 ? "True" : "False"}`;
            } else if (title.includes("pir field")) {
              return `PIR: ${value === 1 ? "Detected" : "Not Detected"}`;
            } else if (title.includes("cửa") || title.includes("open.json")) {
              return `Trạng thái: ${value === 1 ? "Mở" : "Đóng"}`;
            } else if (title.includes("PIR")) {
              return `Phát hiện: ${
                value === 1 ? "Có chuyển động" : "Không có"
              }`;
            }
            return `Giá trị: ${value}`;
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
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: title.includes("success field")
            ? "Success (0=False, 1=True)"
            : title.includes("pir field")
            ? "PIR Detection (0=No, 1=Yes)"
            : title.includes("cửa") || title.includes("open.json")
            ? "Trạng thái (0=Đóng, 1=Mở)"
            : title.includes("PIR")
            ? "Phát hiện (0=Không, 1=Có)"
            : "Giá trị",
        },
        min: 0,
        max:
          title.includes("cửa") ||
          title.includes("PIR") ||
          title.includes("open.json") ||
          title.includes("success field") ||
          title.includes("pir field")
            ? 1.2
            : undefined,
        ticks: {
          stepSize:
            title.includes("cửa") ||
            title.includes("PIR") ||
            title.includes("open.json") ||
            title.includes("success field") ||
            title.includes("pir field")
              ? 1
              : undefined,
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
        Tổng số điểm dữ liệu: {data.length}
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
