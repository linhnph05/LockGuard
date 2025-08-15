export const controlServo = async (action) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Không tìm thấy token xác thực");
    }

    const response = await fetch("/api/servo/control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Lỗi HTTP! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error controlling servo:", error);
    throw error;
  }
};
