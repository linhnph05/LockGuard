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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!newPasswordKey || !confirmPasswordKey) {
      setError("All fields are required");
      return;
    }

    if (newPasswordKey !== confirmPasswordKey) {
      setError("Password keys do not match");
      return;
    }

    if (newPasswordKey.length !== 6) {
      setError("Password key must be exactly 6 characters");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/auth/change-password-key",
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
        onSuccess("Password key updated successfully!");
        handleClose();
      } else {
        setError(data.error || "Failed to update password key");
      }
    } catch (error) {
      console.error("Error changing password key:", error);
      setError("Network error. Please try again.");
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
          <Typography variant="h6">Change IoT Device Password Key</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Update the 6-digit password key used by your IoT device
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
              label="New Password Key"
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
              helperText="Enter a new 6-digit password key for your IoT device"
              error={newPasswordKey.length > 0 && newPasswordKey.length !== 6}
            />

            <TextField
              label="Confirm New Password Key"
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
              helperText="Confirm your new 6-digit password key"
              error={
                confirmPasswordKey.length > 0 &&
                confirmPasswordKey !== newPasswordKey
              }
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
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
            {loading ? "Updating..." : "Update Password Key"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordKeyModal;
