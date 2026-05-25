require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addColumn() {
  try {
    console.log('Adding payment_proof column...');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof TEXT;');
    console.log('Column added successfully!');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await pool.end();
  }
}

addColumn();
