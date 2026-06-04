"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import { matches, predictions, rounds } from "@/db/schema";
import { getAvailablePredictions, isGroupStageComplete, isPredictionAllowed, type PredictionValue } from "@/lib/domain";
import { getCurrentUserId } from "@/lib/session";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  prediction: z.enum(["home", "draw", "away"])
});

export type ActionState = {
  ok: boolean;
  message: string;
};

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  void formData;
  return { ok: false, message: "Sign up is now handled securely through Clerk." };
}

export async function savePredictionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: "Sign up before making predictions." };
  }

  const parsed = predictionSchema.safeParse({
    matchId: formData.get("matchId"),
    prediction: formData.get("prediction")
  });

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid prediction." };
  }

  const database = getDb();
  const [match] = await database
    .select({ match: matches, round: rounds })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .where(eq(matches.id, parsed.data.matchId))
    .limit(1);

  if (!match) {
    return { ok: false, message: "Match not found." };
  }

  const available = getAvailablePredictions(match.match);
  if (!available.includes(parsed.data.prediction as PredictionValue)) {
    return { ok: false, message: "That prediction is not available for this match." };
  }

  if (match.match.status === "final") {
    return { ok: false, message: "This result is final, so the prediction is locked." };
  }

  const groupMatches = match.match.type === "knockout" ? await database.select().from(matches).where(eq(matches.type, "group")) : [];
  const groupStageComplete = match.match.type === "knockout" ? isGroupStageComplete(groupMatches) : true;

  if (match.match.type === "knockout" && !groupStageComplete) {
    return { ok: false, message: "Knockout predictions open after the group stage finishes." };
  }

  if (!isPredictionAllowed({ ...match.match, round: match.round }, new Date(), { groupStageComplete })) {
    return { ok: false, message: "This match is locked." };
  }

  await database
    .insert(predictions)
    .values({
      userId,
      matchId: parsed.data.matchId,
      prediction: parsed.data.prediction
    })
    .onConflictDoUpdate({
      target: [predictions.userId, predictions.matchId],
      set: {
        prediction: parsed.data.prediction,
        updatedAt: sql`now()`
      }
    });

  revalidatePath("/");

  return { ok: true, message: "Prediction saved." };
}
