import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getAuthSecret,
} from "./constants";

export interface SessionUser {
  userId: string;
  email: string;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
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

    if (typeof userId !== "string" || typeof email !== "string") {
      return null;
    }

    return { userId, email };
  } catch {
    return null;
  }
}
