const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "admin123";
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log("Password:", password);
    console.log("Hash:", hash);

    // Verify the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log("Hash verification:", isValid);
  } catch (error) {
    console.error("Error:", error);
  }
}

generateHash();
