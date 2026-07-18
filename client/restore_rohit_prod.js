const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const prisma = require('./prisma/client');

async function run() {
  const ids = [
    '86e99af4-e1eb-4231-bbf0-97f7c9eb7309',
    'ff229fbe-348c-40db-9830-08af966d22c2',
    'd4cf3762-abcd-43a3-9646-40c2617182aa'
  ];

  try {
    for (const id of ids) {
      console.log(`\n=== Checking ID in other tables: ${id} ===`);
      const leadCount = await prisma.lead.count({ where: { assignedTo: id } });
      const callLogCount = await prisma.callLog.count({ where: { employeeId: id } });
      const paymentCount = await prisma.payment.count({ where: { createdBy: id } });
      
      console.log(`Lead Count: ${leadCount}`);
      console.log(`CallLog Count: ${callLogCount}`);
      console.log(`Payment Count: ${paymentCount}`);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
