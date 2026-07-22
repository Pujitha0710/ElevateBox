import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "elevatebox_session";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const SESSION_TOKEN_BYTES = 32;
const SESSION_CREATION_ATTEMPTS = 3;

const currentUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type CurrentUser = Prisma.UserGetPayload<{
  select: typeof currentUserSelect;
}>;

type CreatedSession = {
  rawToken: string;
  expiresAt: Date;
};

function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function createDatabaseSession(
  userId: string,
): Promise<CreatedSession> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  for (
    let attempt = 1;
    attempt <= SESSION_CREATION_ATTEMPTS;
    attempt += 1
  ) {
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    try {
      await db.session.create({
        data: {
          token: tokenHash,
          userId,
          expiresAt,
        },
      });

      return {
        rawToken,
        expiresAt,
      };
    } catch (error: unknown) {
      if (
        isUniqueConstraintError(error) &&
        attempt < SESSION_CREATION_ATTEMPTS
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to create a unique session token.");
}

export async function startSession(userId: string): Promise<void> {
  const { rawToken, expiresAt } =
    await createDatabaseSession(userId);

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);

  const session = await db.session.findUnique({
    where: {
      token: tokenHash,
    },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: currentUserSelect,
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session
      .delete({
        where: {
          id: session.id,
        },
      })
      .catch(() => undefined);

    return null;
  }

  return session.user;
}

export async function requirePageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function endCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken);

    await db.session
      .deleteMany({
        where: {
          token: tokenHash,
        },
      })
      .catch(() => undefined);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}