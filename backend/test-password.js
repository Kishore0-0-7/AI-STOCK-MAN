const bcrypt = require("bcryptjs");

async function testPassword() {
  const plainPassword = "admin123";
  const hashedPassword =
    "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2";

  console.log("Testing password comparison...");
  console.log("Plain password:", plainPassword);
  console.log("Hashed password:", hashedPassword);

  const isValid = await bcrypt.compare(plainPassword, hashedPassword);
  console.log("Password valid:", isValid);

  // Also test creating a new hash
  const newHash = await bcrypt.hash(plainPassword, 12);
  console.log("New hash:", newHash);

  const newIsValid = await bcrypt.compare(plainPassword, newHash);
  console.log("New hash valid:", newIsValid);
}

testPassword().catch(console.error);
