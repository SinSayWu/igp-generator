
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ops = await prisma.opportunity.findMany({ take: 3 });
  console.log("Opportunity IDs sample:");
  ops.forEach(o => console.log(`${o.title} -> ${o.id}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
