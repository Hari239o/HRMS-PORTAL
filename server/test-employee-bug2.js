const assert = require('assert');

async function test() {
  try {
    // 1. Login as admin
    const loginRes = await fetch('http://localhost:5002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'harikishorereddy9908@gmail.com',
        password: 'Hari@9908',
        deviceId: 'test_device'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');
    const token = loginData.token;
    console.log('Logged in successfully as admin.');

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    // 2. Add an employee
    const email = `test${Date.now()}@test.com`;
    const newEmp = {
      name: 'Test Employee ' + Date.now(),
      email: email,
      password: 'password123',
      role: 'employee',
      department: 'Testing'
    };
    const addRes = await fetch('http://localhost:5002/api/employees', {
      method: 'POST',
      headers,
      body: JSON.stringify(newEmp)
    });
    const addData = await addRes.json();
    if (!addRes.ok) throw new Error(addData.error || 'Add employee failed');
    console.log('Added employee successfully');

    // 3. Verify employee exists
    const getRes1 = await fetch('http://localhost:5002/api/employees', { headers });
    const employees1 = await getRes1.json();
    const found1 = employees1.find(e => e.email === email);
    assert(found1, 'Employee should exist before checkout');
    console.log('Employee exists before checkout with ID:', found1.id);

    // 4. Admin Checkout
    try {
      const checkoutRes = await fetch('http://localhost:5002/api/attendance/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: 17.438847,
          longitude: 78.394719
        })
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) console.log('Admin checkout response:', checkoutData.error);
      else console.log('Admin checked out successfully.');
    } catch (err) {
      console.log('Checkout failed network:', err.message);
    }

    // 5. Verify employee still exists
    const getRes2 = await fetch('http://localhost:5002/api/employees', { headers });
    const employees2 = await getRes2.json();
    const found2 = employees2.find(e => e.email === email);
    
    if (!found2) {
      console.error('ERROR: Employee was DELETED after checkout!');
    } else {
      console.log('SUCCESS: Employee still exists after checkout.');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
