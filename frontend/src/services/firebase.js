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

export const fetchUserPirDataMultipleDays = async (username, days = 14) => {
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
            timestamp: value.time,
            value: value.pir,
            date: dates[index],
            ...value,
          });
        });
      }
    });

    const sortedData = combinedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-10);
    console.log(`Processed last 10 PIR data points for ${username}:`, sortedData);
    return sortedData;
  } catch (error) {
    console.error("Error fetching multi-day PIR data:", error);
    return [];
  }
};

export const fetchUserDoorHistory = async (username, date = getCurrentDate()) => {
  try {
    const url = `${FIREBASE_BASE_URL}/${username}/${date}/historyDoor.json`;
    console.log("Fetching door history from:", url);
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Door history data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching door history:", error);
    return null;
  }
};

export const fetchUserDoorHistoryMultipleDays = async (username, days = 14) => {
  try {
    console.log(
      `Fetching door history for user: ${username}, last ${days} days`
    );
    const dates = getRecentDates(days);
    const promises = dates.map((date) => fetchUserDoorHistory(username, date));
    const results = await Promise.all(promises);

    const combinedData = [];
    results.forEach((dayData, index) => {
      if (dayData && typeof dayData === "object") {
        Object.entries(dayData).forEach(([key, value]) => {
          combinedData.push({
            id: `${dates[index]}_${key}`,
            timestamp: value.time,
            value: value.open, 
            status: value.open ? "open" : "close",
            date: dates[index],
            ...value,
          });
        });
      }
    });

    const sortedData = combinedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-10);
    console.log(`Processed last 10 door history data points for ${username}:`, sortedData);
    return sortedData;
  } catch (error) {
    console.error("Error fetching multi-day door history:", error);
    return [];
  }
};

export const realTimeFetching = (
  username,
  onPirDataUpdate,
  onDoorHistoryUpdate,
  interval = 2000
) => {
  let isFetching = true;

  const fetchData = async () => {
    if (!isFetching) return;

    try {
      const [pirData, doorHistory] = await Promise.all([
        fetchUserPirDataMultipleDays(username, 14), 
        fetchUserDoorHistoryMultipleDays(username, 14), 
      ]);

      if (isFetching && pirData !== null) {
        onPirDataUpdate(pirData);
      }

      if (isFetching && doorHistory !== null) {
        onDoorHistoryUpdate(doorHistory);
      }
    } catch (error) {
      console.error("Error in fetching:", error);
    }
  };
  fetchData();
  const intervalId = setInterval(fetchData, interval);
  return () => {
    isFetching = false;
    clearInterval(intervalId);
  };
};
