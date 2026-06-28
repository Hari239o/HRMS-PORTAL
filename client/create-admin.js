const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Hari@9908', 10);
  
  await prisma.employee.upsert({
    where: { email: 'harikishorereddy9908@gmail.com' },
    update: { 
      role: 'admin', 
      password: hashedPassword 
    },
    create: { 
      email: 'harikishorereddy9908@gmail.com', 
      password: hashedPassword, 
      name: 'Admin Hari', 
      role: 'admin', 
      department: 'Admin' 
    }
  });
  
  console.log('Admin user successfully created/updated!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
