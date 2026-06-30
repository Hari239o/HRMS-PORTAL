const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  await prisma.employee.updateMany({ where: { name: { contains: 'Shiva' } }, data: { avatar: 'https://i.pravatar.cc/150?u=shiva' } }); 
  await prisma.employee.updateMany({ where: { name: { contains: 'Sai' } }, data: { avatar: 'https://i.pravatar.cc/150?u=sai' } }); 
  await prisma.employee.updateMany({ where: { name: { contains: 'jithendra' } }, data: { avatar: 'https://i.pravatar.cc/150?u=jithendra' } }); 
  await prisma.employee.updateMany({ where: { name: { contains: 'Admin' } }, data: { avatar: 'https://i.pravatar.cc/150?u=admin' } }); 
} 
run().finally(()=>prisma.$disconnect());
