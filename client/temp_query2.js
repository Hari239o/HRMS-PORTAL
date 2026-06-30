const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
prisma.employee.findMany().then(e => console.log(JSON.stringify(e.map(x => ({name: x.name, avatar: x.avatar})), null, 2))).catch(console.error).finally(()=>prisma.$disconnect());
