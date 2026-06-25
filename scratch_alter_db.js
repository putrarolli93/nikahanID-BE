const db = require('./src/config/database');

async function migrate() {
  try {
    console.log("Altering withdrawals...");
    await db.execute('ALTER TABLE withdrawals ADD COLUMN proof_image VARCHAR(255) NULL');
    console.log("withdrawals altered.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log("proof_image already exists.");
    else throw e;
  }

  try {
    console.log("Altering commissions...");
    await db.execute('ALTER TABLE commissions ADD COLUMN withdrawal_id INT NULL');
    console.log("commissions altered.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log("withdrawal_id already exists.");
    else throw e;
  }

  process.exit();
}

migrate();
