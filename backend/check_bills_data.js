const { executeQuery } = require("./config/db");

async function checkBillsData() {
  try {
    const bills = await executeQuery("SELECT * FROM bills LIMIT 3");
    console.log("Bills data:");
    console.table(bills);

    const billItems = await executeQuery("SELECT * FROM bill_items LIMIT 3");
    console.log("Bill items data:");
    console.table(billItems);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkBillsData();
