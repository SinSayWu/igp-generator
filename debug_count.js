
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findFirst({
      include: { opportunityRecommendations: true }
  });
  
  if (!student) {
      console.log("No student found");
      return;
  }

  const totalOps = await prisma.opportunity.count();
  console.log(`Total Opportunities in DB: ${totalOps}`);
  console.log(`Recommendations for student ${student.userId}: ${student.opportunityRecommendations.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
