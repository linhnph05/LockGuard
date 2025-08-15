import { useEffect, useState } from "react";
import LineChart from "./LineChart";
import ChangePasswordKeyModal from "./ChangePasswordKeyModal";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { realTimeFetching } from "../services/firebase";
import { controlServo } from "../services/servo";

const Dashboard = ({ user, onLogout }) => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // servo
  const [servoAction, setServoAction] = useState("close");
  const [servoLoading, setServoLoading] = useState(false);
  const [servoMessage, setServoMessage] = useState("");

  // line chart
  const [pirChartData, setPirChartData] = useState([]);
  const [doorHistoryData, setDoorHistoryData] = useState([]);

  useEffect(() => {
    if (!user || !user.username) {
      console.error("No user information available");
      return;
    }

    const cleanup = realTimeFetching(
      user.username,
      (newPirData) => {
        setPirChartData(newPirData);
        setLastUpdate(new Date().toLocaleTimeString());
      },
      (newDoorHistory) => {
        setDoorHistoryData(newDoorHistory);
        setLastUpdate(new Date().toLocaleTimeString());
      },
      2000
    );

    return () => {
      cleanup();
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
  };

  const handlePasswordKeySuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessAlert(true);
  };

  const handleCloseSuccessAlert = () => {
    setSuccessMessage("");
    setShowSuccessAlert(false);
  };

  const handleServoControl = async () => {
    setServoLoading(true);
    setServoMessage("");

    try {
      const result = await controlServo(servoAction);
      setServoMessage(
        `Lệnh ${
          servoAction === "open" ? "mở" : "đóng"
        } cửa đã được gửi thành công!`
      );
      console.log("Servo control result:", result);
    } catch (error) {
      setServoMessage(`Lỗi: ${error.message}`);
      console.error("Servo control error:", error);
    } finally {
      setServoLoading(false);
    }
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {" "}
            LockGuard Dashboard - Người dùng {user.username}
          </Typography>
          <Button
            color="inherit"
            startIcon={<SettingsIcon />}
            onClick={() => setChangePasswordModalOpen(true)}
            sx={{ mr: 2 }}
          >
            Đổi mật khẩu khoá
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            {" "}
            Đăng xuất{" "}
          </Button>
        </Toolbar>
      </AppBar>

      <div style={{ padding: "20px" }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {" "}
            Dashboard Giám Sát{" "}
          </Typography>
          {lastUpdate && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Cập nhật lần cuối: {lastUpdate}
            </Typography>
          )}
        </Box>

        {/* Firebase Real-time Data */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trạng thái PIR gần đây
                </Typography>
                {pirChartData && pirChartData.length > 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Chip
                      label={
                        pirChartData[pirChartData.length - 1]?.value
                          ? "PHÁT HIỆN"
                          : "KHÔNG PHÁT HIỆN"
                      }
                      color={
                        pirChartData[pirChartData.length - 1]?.value
                          ? "error"
                          : "success"
                      }
                      variant="filled"
                    />
                    <Typography variant="body2">
                      {pirChartData[pirChartData.length - 1]?.value
                        ? "Có chuyển động"
                        : "Không có chuyển động"}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Đang tải dữ liệu PIR...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trạng thái cửa hiện tại
                </Typography>
                {doorHistoryData && doorHistoryData.length > 0 ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Chip
                        label={
                          doorHistoryData[doorHistoryData.length - 1]
                            ?.status === "open"
                            ? "MỞ"
                            : "ĐÓNG"
                        }
                        color={
                          doorHistoryData[doorHistoryData.length - 1]
                            ?.status === "open"
                            ? "warning"
                            : "success"
                        }
                        variant="filled"
                        icon={
                          doorHistoryData[doorHistoryData.length - 1]
                            ?.status === "open" ? (
                            <LockOpenIcon />
                          ) : (
                            <LockIcon />
                          )
                        }
                      />
                      <Typography variant="body2">
                        {doorHistoryData[doorHistoryData.length - 1]?.status ===
                        "open"
                          ? "Cửa đang mở"
                          : "Cửa đang đóng"}
                      </Typography>
                    </Box>
                    {doorHistoryData[doorHistoryData.length - 1]?.timestamp && (
                      <Typography variant="caption" color="textSecondary">
                        Cập nhật:{" "}
                        {new Date(
                          doorHistoryData[doorHistoryData.length - 1]?.timestamp
                        ).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Đang tải trạng thái cửa...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Điều khiển cửa
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <ToggleButtonGroup
                    value={servoAction}
                    exclusive
                    onChange={(event, newAction) => {
                      if (newAction !== null) {
                        setServoAction(newAction);
                      }
                    }}
                    aria-label="servo action"
                    fullWidth
                  >
                    <ToggleButton value="open" aria-label="open door">
                      <LockOpenIcon sx={{ mr: 1 }} />
                      Mở cửa
                    </ToggleButton>
                    <ToggleButton value="close" aria-label="close door">
                      <LockIcon sx={{ mr: 1 }} />
                      Đóng cửa
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Button
                    variant="contained"
                    onClick={handleServoControl}
                    disabled={servoLoading}
                    fullWidth
                    startIcon={
                      servoLoading ? (
                        <CircularProgress size={20} />
                      ) : servoAction === "open" ? (
                        <LockOpenIcon />
                      ) : (
                        <LockIcon />
                      )
                    }
                  >
                    {servoLoading
                      ? "Đang xử lý..."
                      : `${servoAction === "open" ? "Mở" : "Đóng"} cửa`}
                  </Button>

                  {servoMessage && (
                    <Typography
                      variant="body2"
                      color={servoMessage.includes("Lỗi") ? "error" : "success"}
                      sx={{ textAlign: "center" }}
                    >
                      {servoMessage}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <LineChart
          title={`Dữ liệu cảm biến PIR của ${user.username} (10 điểm gần đây)`}
          data={pirChartData}
        />

        <Box sx={{ mt: 4 }}>
          <LineChart
            title={`Lịch sử trạng thái cửa của ${user.username} (10 điểm gần đây)`}
            data={doorHistoryData}
          />
        </Box>
      </div>

      <ChangePasswordKeyModal
        open={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        onSuccess={handlePasswordKeySuccess}
      />

      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={6000}
        onClose={handleCloseSuccessAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessAlert}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Dashboard;
