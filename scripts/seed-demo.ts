import { asc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { matches, predictions, users, type Match } from "@/db/schema";
import { seedDatabase } from "@/lib/queries";

type DemoUser = {
  firstName: string;
  lastName: string;
  email: string;
  pickCount: number;
  skill: number;
};

const demoUsers: DemoUser[] = [
  { firstName: "Aisha", lastName: "Patel", email: "aisha.patel@tomoro.ai", pickCount: 72, skill: 0.78 },
  { firstName: "Ben", lastName: "Morgan", email: "ben.morgan@tomoro.ai", pickCount: 68, skill: 0.7 },
  { firstName: "Chloe", lastName: "Evans", email: "chloe.evans@tomoro.ai", pickCount: 66, skill: 0.62 },
  { firstName: "Daniel", lastName: "Okafor", email: "daniel.okafor@tomoro.ai", pickCount: 60, skill: 0.74 },
  { firstName: "Ella", lastName: "Wright", email: "ella.wright@tomoro.ai", pickCount: 58, skill: 0.56 },
  { firstName: "Farah", lastName: "Khan", email: "farah.khan@tomoro.ai", pickCount: 54, skill: 0.68 },
  { firstName: "George", lastName: "Williamson", email: "george.demo@tomoro.ai", pickCount: 52, skill: 0.66 },
  { firstName: "Hannah", lastName: "Taylor", email: "hannah.taylor@tomoro.ai", pickCount: 48, skill: 0.61 },
  { firstName: "Isaac", lastName: "Chen", email: "isaac.chen@tomoro.ai", pickCount: 44, skill: 0.72 },
  { firstName: "Jess", lastName: "Miller", email: "jess.miller@tomoro.ai", pickCount: 41, skill: 0.58 },
  { firstName: "Kai", lastName: "Robinson", email: "kai.robinson@tomoro.ai", pickCount: 38, skill: 0.64 },
  { firstName: "Lina", lastName: "Garcia", email: "lina.garcia@tomoro.ai", pickCount: 35, skill: 0.69 },
  { firstName: "Maya", lastName: "Singh", email: "maya.singh@tomoro.ai", pickCount: 31, skill: 0.53 },
  { firstName: "Noah", lastName: "Brooks", email: "noah.brooks@tomoro.ai", pickCount: 27, skill: 0.6 },
  { firstName: "Olivia", lastName: "Reed", email: "olivia.reed@tomoro.ai", pickCount: 23, skill: 0.75 },
  { firstName: "Priya", lastName: "Shah", email: "priya.shah@tomoro.ai", pickCount: 19, skill: 0.67 },
  { firstName: "Ravi", lastName: "Mehta", email: "ravi.mehta@tomoro.ai", pickCount: 15, skill: 0.71 },
  { firstName: "Sofia", lastName: "Martinez", email: "sofia.martinez@tomoro.ai", pickCount: 11, skill: 0.59 },
  { firstName: "Tom", lastName: "Lewis", email: "tom.lewis@tomoro.ai", pickCount: 7, skill: 0.8 },
  { firstName: "Zara", lastName: "Ali", email: "zara.ali@tomoro.ai", pickCount: 4, skill: 0.85 }
];

const demoResults = [
  [2, 1],
  [1, 1],
  [0, 2],
  [3, 0],
  [1, 0],
  [2, 2],
  [0, 1],
  [2, 0],
  [1, 2],
  [3, 1],
  [0, 0],
  [2, 1],
  [1, 3],
  [2, 0],
  [1, 1],
  [0, 2],
  [2, 2],
  [3, 0],
  [1, 0],
  [2, 1],
  [0, 1],
  [1, 2],
  [4, 1],
  [0, 0]
] as const;

function outcomeFor(homeScore: number, awayScore: number): "home" | "draw" | "away" {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

function deterministicNoise(userIndex: number, matchNumber: number) {
  const value = Math.sin((userIndex + 1) * 19.19 + matchNumber * 7.31) * 10000;
  return value - Math.floor(value);
}

function choosePrediction(user: DemoUser, userIndex: number, match: Match) {
  const resultIndex = match.matchNumber - 1;
  const result = demoResults[resultIndex];
  const actual = result ? outcomeFor(result[0], result[1]) : (["home", "draw", "away"] as const)[match.matchNumber % 3];
  const noise = deterministicNoise(userIndex, match.matchNumber);

  if (noise < user.skill) {
    return actual;
  }

  if (actual === "home") return noise > 0.88 ? "draw" : "away";
  if (actual === "away") return noise > 0.88 ? "draw" : "home";
  return noise > 0.5 ? "home" : "away";
}

async function main() {
  await seedDatabase();

  const database = getDb();
  const groupMatches = await database
    .select()
    .from(matches)
    .where(inArray(matches.roundId, ["group-1", "group-2", "group-3"]))
    .orderBy(asc(matches.matchNumber));

  for (const [index, result] of demoResults.entries()) {
    const match = groupMatches[index];
    if (!match) continue;

    const [homeScore, awayScore] = result;
    await database
      .update(matches)
      .set({
        status: "final",
        homeScore,
        awayScore,
        actualOutcome: outcomeFor(homeScore, awayScore),
        updatedAt: sql`now()`
      })
      .where(eq(matches.id, match.id));
  }

  for (const [userIndex, user] of demoUsers.entries()) {
    const [savedUser] = await database
      .insert(users)
      .values({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: user.firstName,
          lastName: user.lastName
        }
      })
      .returning();

    const matchesToPredict = groupMatches.slice(0, Math.min(user.pickCount, groupMatches.length));
    for (const match of matchesToPredict) {
      await database
        .insert(predictions)
        .values({
          userId: savedUser.id,
          matchId: match.id,
          prediction: choosePrediction(user, userIndex, match),
          updatedAt: new Date(Date.UTC(2026, 5, 8 + userIndex, 9 + (match.matchNumber % 8)))
        })
        .onConflictDoUpdate({
          target: [predictions.userId, predictions.matchId],
          set: {
            prediction: choosePrediction(user, userIndex, match),
            updatedAt: sql`excluded.updated_at`
          }
        });
    }
  }

  console.log(`Seeded ${demoUsers.length} demo users, ${demoResults.length} final results and varied prediction volumes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
