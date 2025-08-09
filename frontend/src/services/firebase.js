const FIREBASE_BASE_URL = "https://door-lock-d2b3b-default-rtdb.firebaseio.com";

const fetchOptions = {
  method: "GET",
  headers: {
    Accept: "application/json",
  },
  mode: "cors",
};

const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

const getRecentDates = (days = 7) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

export const fetchUserPirData = async (username, date = getCurrentDate()) => {
  try {
    const url = `${FIREBASE_BASE_URL}/${username}/${date}/PIR.json`;
    console.log("Fetching PIR data from:", url);
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("PIR data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching PIR data:", error);
    return null;
  }
};

export const fetchUserPasswordHistory = async (
  username,
  date = getCurrentDate()
) => {
  try {
    const url = `${FIREBASE_BASE_URL}/${username}/${date}/historyCheckPassword.json`;
    console.log("Fetching password history from:", url);
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Password history data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching password history:", error);
    return null;
  }
};

export const fetchUserPirDataMultipleDays = async (username, days = 7) => {
  try {
    console.log(`Fetching PIR data for user: ${username}, last ${days} days`);
    const dates = getRecentDates(days);
    const promises = dates.map((date) => fetchUserPirData(username, date));
    const results = await Promise.all(promises);

    const combinedData = [];
    results.forEach((dayData, index) => {
      if (dayData && typeof dayData === "object") {
        Object.entries(dayData).forEach(([key, value]) => {
          combinedData.push({
            id: `${dates[index]}_${key}`,
            timestamp:
              value.time || value.timestamp || new Date().toISOString(),
            value: value.pir !== undefined ? value.pir : 0, // Ensure we get the pir field
            date: dates[index],
            ...value,
          });
        });
      }
    });

    const sortedData = combinedData
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-10);

    console.log(`Processed PIR data for ${username}:`, sortedData);
    return sortedData;
  } catch (error) {
    console.error("Error fetching multi-day PIR data:", error);
    return [];
  }
};

export const fetchUserPasswordHistoryMultipleDays = async (
  username,
  days = 7
) => {
  try {
    console.log(
      `Fetching password history for user: ${username}, last ${days} days`
    );
    const dates = getRecentDates(days);
    const promises = dates.map((date) =>
      fetchUserPasswordHistory(username, date)
    );
    const results = await Promise.all(promises);

    // Combine all data and flatten
    const combinedData = [];
    results.forEach((dayData, index) => {
      if (dayData && typeof dayData === "object") {
        Object.entries(dayData).forEach(([key, value]) => {
          combinedData.push({
            id: `${dates[index]}_${key}`,
            timestamp:
              value.time || value.timestamp || new Date().toISOString(),
            value: value.success ? 1 : 0, // Convert success to 1/0
            date: dates[index],
            ...value,
          });
        });
      }
    });

    const sortedData = combinedData
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-10);

    console.log(`Processed password history data for ${username}:`, sortedData);
    return sortedData;
  } catch (error) {
    console.error("Error fetching multi-day password history:", error);
    return [];
  }
};

export const startRealTimePolling = (
  username,
  onPirDataUpdate,
  onPasswordHistoryUpdate,
  onPasswordHistoryChartUpdate,
  interval = 2000
) => {
  let isPolling = true;

  const pollData = async () => {
    if (!isPolling) return;

    try {
      const [pirData, passwordHistory, passwordHistoryChart] =
        await Promise.all([
          fetchUserPirDataMultipleDays(username, 3), // Get last 3 days of data
          fetchUserPasswordHistory(username), // Current day for display
          fetchUserPasswordHistoryMultipleDays(username, 3), // Last 3 days for chart
        ]);

      if (isPolling && pirData !== null) {
        onPirDataUpdate(pirData);
      }

      if (isPolling && passwordHistory !== null) {
        onPasswordHistoryUpdate(passwordHistory);
      }

      if (isPolling && passwordHistoryChart !== null) {
        onPasswordHistoryChartUpdate(passwordHistoryChart);
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
