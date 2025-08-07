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
  const [doorStatus, setDoorStatus] = useState(null);
  const [pirLogs, setPirLogs] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // New state for Firebase chart data
  const [firebasePirChartData, setFirebasePirChartData] = useState([]);
  const [openJsonHistory, setOpenJsonHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Start Firebase real-time polling
    const cleanup = startRealTimePolling(
      (newDoorStatus) => {
        setDoorStatus(newDoorStatus);
        setLastUpdate(new Date().toLocaleTimeString());

        // Process open.json data for chart
        if (newDoorStatus && typeof newDoorStatus === "object") {
          const openChartData = Object.entries(newDoorStatus)
            .map(([key, value]) => ({
              timestamp:
                value.time || value.timestamp || new Date().toISOString(),
              value: value.success ? 1 : 0, // Use success field: true = 1, false = 0
              id: key,
              ...value,
            }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-50); // Keep last 50 entries

          setOpenJsonHistory(openChartData);
        }
      },
      (newPirLogs) => {
        setPirLogs(newPirLogs);
        setLastUpdate(new Date().toLocaleTimeString());
      },
      2000 // Poll every 2 seconds
    );

    return () => {
      cleanup(); // Stop Firebase polling
    };
  }, []);

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

  const formatPirLogsForDisplay = () => {
    if (!pirLogs || typeof pirLogs !== "object") return [];

    return Object.entries(pirLogs)
      .map(([key, value]) => ({
        id: key,
        ...value,
        timestamp: value.timestamp || new Date().toISOString(),
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Show last 10 entries
  };

  // Update chart data when pirLogs changes
  useEffect(() => {
    if (pirLogs) {
      // Process PIR logs for chart data - use pir field
      const pirChartData = Object.entries(pirLogs)
        .map(([key, value]) => ({
          timestamp: value.time || value.timestamp || new Date().toISOString(),
          value: value.success ? 1 : 0,
          id: key,
          ...value,
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-50); // Keep last 50 entries

      setFirebasePirChartData(pirChartData);
    }
  }, [pirLogs]);

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
            {" "}
            Theo dõi trạng thái cảm biến và lịch sử truy cập thời gian thực
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
                  Trạng thái cửa
                </Typography>
                {doorStatus !== null ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Chip
                      label={doorStatus ? "MỞ" : "ĐÓNG"}
                      color={doorStatus ? "error" : "success"}
                      variant="filled"
                    />
                    <Typography variant="body2">
                      {doorStatus ? "Cửa đang mở" : "Cửa đang đóng"}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Đang tải dữ liệu...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lịch sử PIR gần đây
                </Typography>
                {pirLogs ? (
                  <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                    {formatPirLogsForDisplay().map((log, index) => (
                      <Box
                        key={log.id || index}
                        sx={{
                          mb: 1,
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2">
                          <strong>ID:</strong> {log.id}
                        </Typography>
                        {log.timestamp && (
                          <Typography variant="caption" color="textSecondary">
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        )}
                        {Object.entries(log).map(([key, value]) => {
                          if (key !== "id" && key !== "timestamp") {
                            return (
                              <Typography
                                key={key}
                                variant="caption"
                                display="block"
                              >
                                <strong>{key}:</strong> {String(value)}
                              </Typography>
                            );
                          }
                          return null;
                        })}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Đang tải dữ liệu...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <LineChart
          title="Open.json Data (success field)"
          data={openJsonHistory}
        />
        <LineChart
          title="PIR Logs Data (pir field)"
          data={firebasePirChartData}
        />
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
