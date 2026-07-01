const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const t = await prisma.target.findFirst();
    console.log("Success:", !!t);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
