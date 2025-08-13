const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // Empty password for root
  database: "ai_stock_management",
  socketPath: "/var/run/mysqld/mysqld.sock",
};

async function updatePasswords() {
  const connection = await mysql.createConnection(dbConfig);

  // Hash the password 'admin123'
  const hashedPassword = await bcrypt.hash("admin123", 12);
  console.log("Generated hash:", hashedPassword);

  try {
    // Update all users with the new password hash
    const [result] = await connection.execute("UPDATE users SET password = ?", [
      hashedPassword,
    ]);

    console.log("Updated", result.affectedRows, "users");

    // Verify the update
    const [users] = await connection.execute(
      "SELECT email, password FROM users LIMIT 3"
    );
    console.log("Sample users:");
    users.forEach((user) => {
      console.log(`${user.email}: ${user.password.substring(0, 20)}...`);
    });
  } catch (error) {
    console.error("Error updating passwords:", error);
  } finally {
    await connection.end();
  }
}

updatePasswords().catch(console.error);
