const axios = require('axios');
const assert = require('assert');

async function test() {
  try {
    // 1. Login as admin
    const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'harikishorereddy9908@gmail.com',
      password: 'Hari@9908',
      deviceId: 'test_device'
    });
    const token = loginRes.data.token;
    console.log('Logged in successfully as admin.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Add an employee
    const newEmp = {
      name: 'Test Employee',
      email: `test${Date.now()}@test.com`,
      password: 'password123',
      role: 'employee',
      department: 'Testing'
    };
    const addRes = await axios.post('http://localhost:5002/api/employees', newEmp, { headers });
    const empId = addRes.data.id;
    console.log('Added employee with ID:', empId);

    // 3. Verify employee exists
    const getRes1 = await axios.get('http://localhost:5002/api/employees', { headers });
    const found1 = getRes1.data.find(e => e.id === empId);
    assert(found1, 'Employee should exist before checkout');
    console.log('Employee exists before checkout.');

    // 4. Admin Checkout
    try {
      await axios.post('http://localhost:5002/api/attendance/checkout', {
        latitude: 17.438847,
        longitude: 78.394719
      }, { headers });
      console.log('Admin checked out successfully.');
    } catch (err) {
      console.log('Admin checkout response (might be already checked out):', err.response?.data?.error);
    }

    // 5. Verify employee still exists
    const getRes2 = await axios.get('http://localhost:5002/api/employees', { headers });
    const found2 = getRes2.data.find(e => e.id === empId);
    if (!found2) {
      console.error('ERROR: Employee was DELETED after checkout!');
    } else {
      console.log('SUCCESS: Employee still exists after checkout.');
    }
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

test();
