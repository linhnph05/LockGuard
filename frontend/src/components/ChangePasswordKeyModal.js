import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const ChangePasswordKeyModal = ({ open, onClose, onSuccess }) => {
  const [newPasswordKey, setNewPasswordKey] = useState("");
  const [confirmPasswordKey, setConfirmPasswordKey] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false); // Show/Hide New Password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Show/Hide Confirm Password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!newPasswordKey || !confirmPasswordKey) {
      setError("Tất cả các trường đều bắt buộc");
      return;
    }

    if (newPasswordKey !== confirmPasswordKey) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPasswordKey.length !== 6) {
      setError("Mật khẩu phải có đúng 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "/api/auth/change-password-key",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newPasswordKey,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        onSuccess("Mật khẩu khoá đã được cập nhật thành công!");
        handleClose();
      } else {
        setError(data.error || "Không thể cập nhật mật khẩu khoá");
      }
    } catch (error) {
      console.error("Error changing password key:", error);
      setError("Lỗi mạng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPasswordKey("");
    setConfirmPasswordKey("");
    setError("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h6">Đổi mật khẩu khoá thiết bị IoT</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Cập nhật mật khẩu 6 chữ số được sử dụng bởi thiết bị IoT của bạn
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Mật khẩu khoá mới"
              type={showNewPassword ? "text" : "password"}
              value={newPasswordKey}
              onChange={(e) => setNewPasswordKey(e.target.value)}
              required
              fullWidth
              inputProps={{
                maxLength: 6,
                style: { letterSpacing: "0.5em", textAlign: "center" },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Nhập mật khẩu 6 chữ số mới cho thiết bị IoT của bạn"
              error={newPasswordKey.length > 0 && newPasswordKey.length !== 6}
            />

            <TextField
              label="Xác nhận mật khẩu khoá mới"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPasswordKey}
              onChange={(e) => setConfirmPasswordKey(e.target.value)}
              required
              fullWidth
              inputProps={{
                maxLength: 6,
                style: { letterSpacing: "0.5em", textAlign: "center" },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Xác nhận mật khẩu 6 chữ số mới của bạn"
              error={
                confirmPasswordKey.length > 0 &&
                confirmPasswordKey !== newPasswordKey
              }
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              loading ||
              newPasswordKey.length !== 6 ||
              confirmPasswordKey !== newPasswordKey
            }
          >
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu khoá"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordKeyModal;
