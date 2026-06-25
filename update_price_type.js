const db = require('./src/config/database');

async function updatePriceType() {
  try {
    await db.query('UPDATE templates SET price_type = ? WHERE price_type = ?', ['Standar', 'Pro']);
    console.log('Successfully updated price_type from Pro to Standar in database!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating price_type:', error);
    process.exit(1);
  }
}

updatePriceType();
