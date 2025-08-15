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
        borderColor: title.includes("Door")
          ? "#2196f3"
          : title.includes("Password")
          ? "#ff9800"
          : "#4caf50",
        backgroundColor: title.includes("Door")
          ? "rgba(33, 150, 243, 0.1)"
          : title.includes("Password")
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
            if (title.includes("Door")) {
              return `Trạng thái cửa: ${value === 1 ? "Mở" : "Đóng"}`;
            } else if (title.includes("Password")) {
              return `Kiểm tra mật khẩu: ${
                value === 1 ? "Thành công" : "Thất bại"
              }`;
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
          text: "Thời gian (Ngày/Tháng/Năm Giờ:Phút:Giây)",
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
          text: title.includes("Door")
            ? "Trạng thái cửa (0=Đóng, 1=Mở)"
            : title.includes("Password")
            ? "Kiểm tra mật khẩu (0=Thất bại, 1=Thành công)"
            : "Cảm biến PIR (0=Không phát hiện, 1=Phát hiện)",
        },
        min: 0,
        max: 1.2,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            if (title.includes("Door")) {
              if (value === 0) return "Đóng";
              if (value === 1) return "Mở";
            } else if (title.includes("Password")) {
              if (value === 0) return "Thất bại";
              if (value === 1) return "Thành công";
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
