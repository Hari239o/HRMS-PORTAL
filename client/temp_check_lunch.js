const prisma = require('./prisma/client');
async function run() {
  const allEmployees = await prisma.employee.findMany();
  console.log("Employees:", allEmployees.map(e => ({ id: e.id, name: e.name, role: e.role })));
  const todayDate = new Date().toISOString().split('T')[0];
  const attendancesToday = await prisma.attendance.findMany({ where: { date: todayDate } });
  console.log("Attendances Today:", attendancesToday);
}
run().then(() => process.exit(0));
