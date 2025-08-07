// Firebase service for fetching real-time data
const FIREBASE_BASE_URL = "https://door-lock-d2b3b-default-rtdb.firebaseio.com";
const OPEN_URL = `${FIREBASE_BASE_URL}/open.json`;
const PIR_LOGS_URL = `${FIREBASE_BASE_URL}/pir_logs.json`;

// Common fetch options
const fetchOptions = {
  method: "GET",
  headers: {
    Accept: "application/json",
  },
  // Add mode: 'cors' to handle CORS if needed
  mode: "cors",
};

// Fetch door open status
export const fetchDoorStatus = async () => {
  try {
    console.log("Fetching door status from:", OPEN_URL);
    const response = await fetch(OPEN_URL, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Door status data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching door status:", error);
    return null;
  }
};

// Fetch PIR logs
export const fetchPirLogs = async () => {
  try {
    console.log("Fetching PIR logs from:", PIR_LOGS_URL);
    const response = await fetch(PIR_LOGS_URL, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("PIR logs data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching PIR logs:", error);
    return null;
  }
};

// Real-time polling function
export const startRealTimePolling = (
  onDoorStatusUpdate,
  onPirLogsUpdate,
  interval = 2000
) => {
  let isPolling = true;

  const pollData = async () => {
    if (!isPolling) return;

    try {
      const [doorStatus, pirLogs] = await Promise.all([
        fetchDoorStatus(),
        fetchPirLogs(),
      ]);

      if (isPolling && doorStatus !== null) {
        onDoorStatusUpdate(doorStatus);
      }

      if (isPolling && pirLogs !== null) {
        onPirLogsUpdate(pirLogs);
      }
    } catch (error) {
      console.error("Error in polling:", error);
    }
  };

  // Initial fetch
  pollData();

  // Set up interval
  const intervalId = setInterval(pollData, interval);

  // Return cleanup function
  return () => {
    isPolling = false;
    clearInterval(intervalId);
  };
};
