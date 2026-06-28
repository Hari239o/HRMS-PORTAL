const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Create Admin
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@geonixa.com' },
    update: {},
    create: {
      name: 'HR Admin',
      email: 'admin@geonixa.com',
      password: hashedPassword,
      role: 'admin',
      department: 'HR'
    }
  });

  // Create Sample Employee
  const empPassword = await bcrypt.hash('emp123', 10);
  const employee = await prisma.employee.upsert({
    where: { email: 'john@geonixa.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@geonixa.com',
      password: empPassword,
      role: 'employee',
      department: 'Engineering'
    }
  });

  // Create Holidays
  await prisma.holiday.createMany({
    data: [
      { name: 'May Day', date: new Date('2024-05-01'), type: 'Public' },
      { name: 'Independence Day', date: new Date('2024-08-15'), type: 'Public' }
    ],
    skipDuplicates: true
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
