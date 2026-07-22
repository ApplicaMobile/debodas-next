import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getAuthSecret,
} from "./constants";

export interface SessionUser {
  userId: string;
  email: string;
  sessionVersion: number;
}

export function sessionVersionMatches(
  tokenVersion: number,
  dbVersion: number,
): boolean {
  return Number.isInteger(tokenVersion) && tokenVersion === dbVersion;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
    sv: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function bumpSessionVersion(userId: string): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return updated.sessionVersion;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = payload.userId;
    const email = payload.email;
    const tokenVersion =
      typeof payload.sv === "number" && Number.isInteger(payload.sv)
        ? payload.sv
        : 0;

    if (typeof userId !== "string" || typeof email !== "string") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true, email: true },
    });

    if (
      !user ||
      !sessionVersionMatches(tokenVersion, user.sessionVersion)
    ) {
      await deleteSession();
      return null;
    }

    return {
      userId,
      email: user.email,
      sessionVersion: user.sessionVersion,
    };
  } catch {
    return null;
  }
}
