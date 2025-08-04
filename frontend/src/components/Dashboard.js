import React, { useEffect, useState } from "react";
import ChartCard from "./Chart";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import socket from "../socket";

const Dashboard = ({ user, onLogout }) => {
  const [pirData, setPirData] = useState([]);
  const [passwordData, setPasswordData] = useState([]);

  useEffect(() => {
    // Set up socket authentication
    const token = localStorage.getItem("token");
    socket.auth = { token };
    socket.connect();

    socket.on("pir", (data) =>
      setPirData((prev) => [...prev.slice(-20), data])
    );
    socket.on("password", (data) =>
      setPasswordData((prev) => [...prev.slice(-20), data])
    );

    return () => {
      socket.off("pir");
      socket.off("password");
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LockGuard System - Xin chào, {user?.username}!
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard Giám Sát
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Theo dõi trạng thái cảm biến và lịch sử truy cập thời gian thực
          </Typography>
        </Box>

        <ChartCard
          title="Cảm biến PIR (Phát hiện chuyển động)"
          data={pirData}
        />
        <ChartCard title="Lịch sử nhập mật khẩu" data={passwordData} />
      </Container>
    </>
  );
};

export default Dashboard;
