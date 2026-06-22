const { query } = require('./src/db');

async function test() {
  try {
    console.log('Checking tables...');
    const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables found:', tables);
    
    const employees = await query("SELECT id, name, email FROM employees");
    console.log('Employees found:', employees);
  } catch (err) {
    console.error('Error during test:', err.message);
  }
}

test();
