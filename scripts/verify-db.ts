import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [users, sessionCount, documentCount, auditEventCount] =
    await Promise.all([
      prisma.user.findMany({
        select: {
          name: true,
          email: true,
          role: true,
        },
        orderBy: {
          email: "asc",
        },
      }),
      prisma.session.count(),
      prisma.document.count(),
      prisma.auditEvent.count(),
    ]);

  if (users.length !== 6) {
    throw new Error(
      `Expected 6 seeded users, but found ${users.length}. Run npm run db:seed.`,
    );
  }

  console.log("Database connection successful.");
  console.table(users);

  console.table({
    users: users.length,
    sessions: sessionCount,
    documents: documentCount,
    auditEvents: auditEventCount,
  });
}

main()
  .catch((error: unknown) => {
    console.error("Database verification failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  