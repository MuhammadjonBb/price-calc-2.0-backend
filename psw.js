const bcrypt = require("bcrypt");

const password = "password123";
async function hashPassword() {
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(hashedPassword);
}

hashPassword();
