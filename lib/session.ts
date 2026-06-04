import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { isTomoroEmail } from "@/lib/domain";

const localAuthDisabled = process.env.DISABLE_CLERK_LOCAL === "true";
const localDevEmail = process.env.LOCAL_DEV_USER_EMAIL ?? "george.demo@tomoro.ai";

export async function getCurrentUserId() {
  if (localAuthDisabled) {
    return getLocalDevUserId();
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail || !isTomoroEmail(primaryEmail)) {
    throw new Error("Please sign in with your @tomoro.ai email address.");
  }

  const email = primaryEmail.toLowerCase();
  const database = getDb();
  const [user] = await database
    .insert(users)
    .values({
      firstName: clerkUser.firstName?.trim() || email.split("@")[0],
      lastName: clerkUser.lastName?.trim() || "Tomoro",
      email
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        firstName: clerkUser.firstName?.trim() || email.split("@")[0],
        lastName: clerkUser.lastName?.trim() || "Tomoro"
      }
    })
    .returning();

  return user.id;
}

async function getLocalDevUserId() {
  if (!isTomoroEmail(localDevEmail)) {
    throw new Error("LOCAL_DEV_USER_EMAIL must be a @tomoro.ai address.");
  }

  const email = localDevEmail.toLowerCase();
  const [first = "Local", ...rest] = email.split("@")[0].split(/[._-]/);
  const database = getDb();
  const [user] = await database
    .insert(users)
    .values({
      firstName: titleCase(first),
      lastName: titleCase(rest.join(" ") || "Dev"),
      email
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        firstName: titleCase(first),
        lastName: titleCase(rest.join(" ") || "Dev")
      }
    })
    .returning();

  return user.id;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function getCurrentAppUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const database = getDb();
  const [user] = await database.select().from(users).where(eq(users.id, userId)).limit(1);

  return user ?? null;
}
