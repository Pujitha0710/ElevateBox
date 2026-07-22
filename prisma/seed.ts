import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const seededUsers = [
  {
    name: "Alice Author",
    email: "alice@example.com",
    role: Role.author,
  },
  {
    name: "Diana Author",
    email: "diana@example.com",
    role: Role.author,
  },
  {
    name: "Bob Reviewer",
    email: "bob@example.com",
    role: Role.reviewer,
  },
  {
    name: "Carol Reviewer",
    email: "carol@example.com",
    role: Role.reviewer,
  },
  {
    name: "Admin User",
    email: "admin@example.com",
    role: Role.admin,
  },
  {
    name: "Victor Viewer",
    email: "viewer@example.com",
    role: Role.viewer,
  },
] satisfies Array<{
  name: string;
  email: string;
  role: Role;
}>;

async function main(): Promise<void> {
  for (const user of seededUsers) {
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        role: user.role,
      },
      create: user,
    });
  }

  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  console.log("Database seeded successfully.");
  console.table(users);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  