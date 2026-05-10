import sequelize from "./config/database.js";

async function checkCustomers() {
  try {
    const [rows] = await sequelize.query(
      `SELECT id_khach_hang, ho_va_ten, cccd, dia_chi, sdt FROM khach_hang WHERE id_khach_hang = 1`,
    );
    if (rows.length > 0) {
      console.log("Customer id=1:");
      console.log(JSON.stringify(rows[0], null, 2));
    } else {
      console.log("No customer with id=1, checking first available...");
      const [allRows] = await sequelize.query(
        `SELECT id_khach_hang, ho_va_ten, cccd, dia_chi, sdt FROM khach_hang ORDER BY id_khach_hang LIMIT 1`,
      );
      if (allRows.length > 0) {
        console.log("First available customer:");
        console.log(JSON.stringify(allRows[0], null, 2));
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

checkCustomers();
