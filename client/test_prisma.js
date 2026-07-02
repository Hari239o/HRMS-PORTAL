const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const subs = await prisma.studentSubmission.findMany({take: 5});
  console.log('Subs:', subs);
  const empIds = subs.map(s => s.employeeId);
  console.log('Emp IDs:', empIds);
  const emps = await prisma.employee.findMany({where: {id: {in: empIds}}});
  console.log('Emps:', emps);
}
run().finally(() => prisma.$disconnect());
