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
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { startRealTimePolling } from "../services/firebase";

const Dashboard = ({ user, onLogout }) => {
  const [passwordHistory, setPasswordHistory] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // State for user-specific PIR chart data
  const [pirChartData, setPirChartData] = useState([]);

  // State for user-specific password history chart data
  const [passwordHistoryChartData, setPasswordHistoryChartData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Ensure we have a user to fetch data for
    if (!user || !user.username) {
      console.error("No user information available");
      return;
    }

    // Start Firebase real-time polling with user-specific data
    const cleanup = startRealTimePolling(
      user.username, // Pass username to fetch user-specific data
      (newPirData) => {
        setPirChartData(newPirData);
        setLastUpdate(new Date().toLocaleTimeString());
      },
      (newPasswordHistory) => {
        setPasswordHistory(newPasswordHistory);
        setLastUpdate(new Date().toLocaleTimeString());
      },
      (newPasswordHistoryChart) => {
        setPasswordHistoryChartData(newPasswordHistoryChart);
        setLastUpdate(new Date().toLocaleTimeString());
      },
      2000 // Poll every 2 seconds
    );

    return () => {
      cleanup(); // Stop Firebase polling
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
    setShowSuccessAlert(false);
    setSuccessMessage("");
  };

  const formatPasswordHistoryForDisplay = () => {
    if (!passwordHistory || typeof passwordHistory !== "object") return [];

    return Object.entries(passwordHistory)
      .map(([key, value]) => ({
        id: key,
        ...value,
        timestamp: value.time || value.timestamp || new Date().toISOString(),
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Show last 10 entries
  };

  // Remove the old useEffect for chart data processing since it's now handled in real-time

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {" "}
            LockGuard Dashboard - User {user.username}
          </Typography>
          <Button
            color="inherit"
            startIcon={<SettingsIcon />}
            onClick={() => setChangePasswordModalOpen(true)}
            sx={{ mr: 2 }}
          >
            Change Password Key
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
          <Typography variant="body1">
            Theo dõi trạng thái cảm biến PIR và lịch sử kiểm tra mật khẩu của{" "}
            {user.username}
          </Typography>
          {lastUpdate && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Cập nhật lần cuối: {lastUpdate}
            </Typography>
          )}
        </Box>

        {/* Firebase Real-time Data */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
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

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lịch sử kiểm tra mật khẩu
                </Typography>
                {passwordHistory ? (
                  <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                    {formatPasswordHistoryForDisplay().map((log, index) => (
                      <Box
                        key={log.id || index}
                        sx={{
                          mb: 1,
                          p: 1,
                          bgcolor: log.success
                            ? "success.light"
                            : "error.light",
                          borderRadius: 1,
                          opacity: 0.8,
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Kết quả:</strong>{" "}
                          {log.success ? "Thành công" : "Thất bại"}
                        </Typography>
                        {log.timestamp && (
                          <Typography variant="caption" color="textSecondary">
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Đang tải dữ liệu lịch sử...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <LineChart
          title={`PIR Detection Data for ${user.username} (Last 10 Points)`}
          data={pirChartData}
        />

        <Box sx={{ mt: 4 }}>
          <LineChart
            title={`Password Check History for ${user.username} (Last 10 Points)`}
            data={passwordHistoryChartData}
          />
        </Box>
      </div>

      {/* Change Password Key Modal */}
      <ChangePasswordKeyModal
        open={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        onSuccess={handlePasswordKeySuccess}
      />

      {/* Success Alert */}
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
