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
  const displayName = getDisplayName({
    email,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName
  });
  const database = getDb();
  const [user] = await database
    .insert(users)
    .values({
      firstName: displayName.firstName,
      lastName: displayName.lastName,
      email
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        firstName: displayName.firstName,
        lastName: displayName.lastName
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
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDisplayName({
  email,
  firstName,
  lastName
}: {
  email: string;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}) {
  const cleanFirst = firstName?.trim();
  const cleanLast = lastName?.trim();
  const emailName = nameFromEmail(email);

  if (!cleanFirst && !cleanLast) {
    return emailName;
  }

  const firstLooksLikeEmailHandle = Boolean(cleanFirst?.includes(".") || cleanFirst?.includes("_") || cleanFirst?.includes("-"));
  const lastLooksLikeOrgPlaceholder = cleanLast?.toLowerCase() === "tomoro";

  if (firstLooksLikeEmailHandle || lastLooksLikeOrgPlaceholder) {
    return emailName;
  }

  return {
    firstName: titleCase(cleanFirst ?? emailName.firstName),
    lastName: titleCase(cleanLast ?? emailName.lastName)
  };
}

function nameFromEmail(email: string) {
  const [first = "Tomoro", ...rest] = email.split("@")[0].split(/[._-]+/).filter(Boolean);

  return {
    firstName: titleCase(first),
    lastName: titleCase(rest.join(" ") || "Predictor")
  };
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
