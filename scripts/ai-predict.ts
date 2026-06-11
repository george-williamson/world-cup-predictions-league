import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { getDb } from "@/db";
import { matches, predictions, rounds, teams, users, type Match, type Round, type Team } from "@/db/schema";
import { getAvailablePredictions, isGroupStageComplete, isPredictionAllowed, type PredictionValue } from "@/lib/domain";
import { loadLocalEnv } from "@/lib/load-env";

loadLocalEnv();

const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

const aiCompetitors = [
  {
    model: "anthropic/claude-fable-5",
    firstName: "Claude",
    lastName: "Fable 5",
    email: "ai.claude-fable-5@tomoro.ai"
  },
  {
    model: "openai/gpt-5.5",
    firstName: "GPT-5.5",
    lastName: "High",
    email: "ai.gpt-5-5-high@tomoro.ai"
  },
  {
    model: "google/gemini-3.5-flash",
    firstName: "Gemini",
    lastName: "3.5 Flash",
    email: "ai.gemini-3-5-flash@tomoro.ai"
  }
] as const;

type AiCompetitor = (typeof aiCompetitors)[number];

type MatchForPrompt = Match & {
  round: Round;
  homeTeam: Team | null;
  awayTeam: Team | null;
};

const predictionResponseSchema = z.object({
  predictions: z
    .array(
      z.object({
        matchId: z.string().min(1),
        prediction: z.enum(["home", "draw", "away"]),
        confidence: z.number().min(0).max(1).optional(),
        note: z.string().max(160).optional()
      })
    )
    .min(1)
});

const openRouterChoiceSchema = z.object({
  finish_reason: z.string().nullable().optional(),
  message: z.object({
    content: z.union([z.string(), z.array(z.unknown())]).nullable().optional()
  })
});

const openRouterResponseSchema = z.object({
  choices: z.array(openRouterChoiceSchema).min(1)
});

const args = new Set(process.argv.slice(2));
const commit = args.has("--commit");
const smokeApi = args.has("--smoke-api");
const dryRun = args.has("--dry-run") || (!commit && !smokeApi);
const allModels = args.has("--all-models") || commit || smokeApi;
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1] ?? "", 10) : smokeApi ? 1 : undefined;
const modelArg = process.argv.find((arg) => arg.startsWith("--model="))?.split("=")[1];

async function main() {
  if (dryRun) {
    runParserSmoke();
  }

  const database = getDb();
  const unlockedMatches = await getUnlockedMatches();
  const selectedMatches = Number.isFinite(limit) ? unlockedMatches.slice(0, limit) : unlockedMatches;
  const selectedCompetitors = modelArg
    ? aiCompetitors.filter((competitor) => competitor.model === modelArg)
    : allModels
      ? aiCompetitors
      : [aiCompetitors[0]];

  if (modelArg && selectedCompetitors.length === 0) {
    throw new Error(`Unknown model ${modelArg}. Expected one of: ${aiCompetitors.map((competitor) => competitor.model).join(", ")}`);
  }

  console.log(
    JSON.stringify(
      {
        mode: commit ? "commit" : smokeApi ? "smoke-api" : "dry-run",
        models: selectedCompetitors.map((competitor) => competitor.model),
        unlockedMatches: unlockedMatches.length,
        selectedMatches: selectedMatches.length
      },
      null,
      2
    )
  );

  if (selectedMatches.length === 0) {
    console.log("No unlocked matches found.");
    return;
  }

  if (dryRun && !smokeApi) {
    printMatchSummary(selectedMatches);
    console.log("Dry run only. Add --smoke-api to call one cheap match per model, then --commit to store full predictions.");
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for --smoke-api or --commit.");
  }

  const validatedResults: Array<{
    competitor: AiCompetitor;
    predictions: z.infer<typeof predictionResponseSchema>["predictions"];
  }> = [];

  for (const competitor of selectedCompetitors) {
    console.log(`Requesting ${selectedMatches.length} predictions from ${competitor.model}...`);
    const modelPredictions = await requestModelPredictions(apiKey, competitor, selectedMatches);
    validatePredictions(selectedMatches, modelPredictions.predictions);
    validatedResults.push({ competitor, predictions: modelPredictions.predictions });

    console.log(
      JSON.stringify(
        {
          model: competitor.model,
          predictions: modelPredictions.predictions.map((prediction) => ({
            matchId: prediction.matchId,
            prediction: prediction.prediction,
            confidence: prediction.confidence
          }))
        },
        null,
        2
      )
    );
  }

  if (commit) {
    for (const result of validatedResults) {
      const { competitor, predictions: modelPredictions } = result;
      const [savedUser] = await database
        .insert(users)
        .values({
          firstName: competitor.firstName,
          lastName: competitor.lastName,
          email: competitor.email
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            firstName: competitor.firstName,
            lastName: competitor.lastName
          }
        })
        .returning();

      await database
        .insert(predictions)
        .values(
          modelPredictions.map((prediction) => ({
            userId: savedUser.id,
            matchId: prediction.matchId,
            prediction: prediction.prediction
          }))
        )
        .onConflictDoUpdate({
          target: [predictions.userId, predictions.matchId],
          set: {
            prediction: sql`excluded.prediction`,
            updatedAt: sql`now()`
          }
        });

      console.log(`Stored ${modelPredictions.length} predictions for ${competitor.firstName} ${competitor.lastName}.`);
    }
  }
}

async function getUnlockedMatches() {
  const database = getDb();
  const awayTeams = alias(teams, "away_team");
  const rows = await database
    .select({
      match: matches,
      round: rounds,
      homeTeam: teams,
      awayTeam: awayTeams
    })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .leftJoin(teams, eq(matches.homeTeamId, teams.id))
    .leftJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .where(and(eq(matches.status, "scheduled"), inArray(matches.type, ["group", "knockout"])))
    .orderBy(asc(matches.kickoffAt), asc(matches.matchNumber));

  const allMatches = rows.map((row) => ({ ...row.match, round: row.round, homeTeam: row.homeTeam, awayTeam: row.awayTeam }));
  const groupStageComplete = isGroupStageComplete(allMatches);
  const now = new Date();

  return allMatches.filter((match) => isPredictionAllowed(match, now, { groupStageComplete }));
}

async function requestModelPredictions(apiKey: string, competitor: AiCompetitor, promptMatches: MatchForPrompt[]) {
  const response = await fetch(openRouterUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "World Cup Predictions League"
    },
    body: JSON.stringify({
      model: competitor.model,
      messages: [
        {
          role: "system",
          content:
            "You are entering a friendly office World Cup prediction leaderboard. Pick the most likely outcome for each match. Use market probabilities when available, but you may disagree. Return only valid JSON matching the schema. Do not include reasoning text."
        },
        {
          role: "user",
          content: buildPrompt(promptMatches)
        }
      ],
      reasoning: {
        effort: "high",
        exclude: true
      },
      temperature: 0.2,
      max_tokens: Math.max(4_000, promptMatches.length * 160),
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "world_cup_predictions",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["predictions"],
            properties: {
              predictions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["matchId", "prediction", "confidence", "note"],
                  properties: {
                    matchId: { type: "string", enum: promptMatches.map((match) => match.id) },
                    prediction: { type: "string", enum: ["home", "draw", "away"] },
                    confidence: { type: "number" },
                    note: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`OpenRouter request failed for ${competitor.model}: ${response.status} ${JSON.stringify(payload)}`);
  }

  const parsedResponse = openRouterResponseSchema.parse(payload);
  const choice = parsedResponse.choices[0];
  const content = choice?.message.content;
  const text = typeof content === "string" ? content : JSON.stringify(content);

  try {
    return predictionResponseSchema.parse(extractJson(text));
  } catch (error) {
    throw new Error(
      `Could not parse ${competitor.model} response. finish_reason=${choice?.finish_reason ?? "unknown"} excerpt=${text.slice(0, 500)}`
    );
  }
}

function buildPrompt(promptMatches: MatchForPrompt[]) {
  return JSON.stringify(
    {
      instruction:
        "For each match, choose exactly one prediction. Use 'home' for the home team, 'away' for the away team, and 'draw' only when draw is listed in availablePredictions.",
      matches: promptMatches.map((match) => ({
        matchId: match.id,
        matchNumber: match.matchNumber,
        round: match.round.name,
        kickoffAt: match.kickoffAt.toISOString(),
        venue: match.venue,
        home: match.homeTeam?.name ?? match.homeSlot,
        away: match.awayTeam?.name ?? match.awaySlot,
        availablePredictions: getAvailablePredictions(match),
        marketProbabilities: {
          home: match.homeWinProbability,
          draw: match.drawProbability,
          away: match.awayWinProbability
        }
      }))
    },
    null,
    2
  );
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return JSON.parse(fenced[1]);

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error(`Could not extract JSON from model response: ${trimmed.slice(0, 300)}`);
}

function validatePredictions(promptMatches: MatchForPrompt[], modelPredictions: Array<{ matchId: string; prediction: PredictionValue }>) {
  const matchById = new Map(promptMatches.map((match) => [match.id, match]));
  const seen = new Set<string>();

  if (modelPredictions.length !== promptMatches.length) {
    throw new Error(`Expected ${promptMatches.length} predictions, received ${modelPredictions.length}.`);
  }

  for (const prediction of modelPredictions) {
    const match = matchById.get(prediction.matchId);
    if (!match) throw new Error(`Model returned unknown matchId ${prediction.matchId}.`);
    if (seen.has(prediction.matchId)) throw new Error(`Model returned duplicate matchId ${prediction.matchId}.`);
    seen.add(prediction.matchId);

    const available = getAvailablePredictions(match);
    if (!available.includes(prediction.prediction)) {
      throw new Error(`Model returned ${prediction.prediction} for ${prediction.matchId}, but available options are ${available.join(", ")}.`);
    }
  }
}

function runParserSmoke() {
  const parsed = predictionResponseSchema.parse(
    extractJson('```json\n{"predictions":[{"matchId":"match-1","prediction":"home","confidence":0.72,"note":"Market edge"}]}\n```')
  );

  if (parsed.predictions[0]?.matchId !== "match-1") {
    throw new Error("Parser smoke failed.");
  }
}

function printMatchSummary(promptMatches: MatchForPrompt[]) {
  for (const match of promptMatches.slice(0, 8)) {
    console.log(
      `${match.id}: ${match.homeTeam?.name ?? match.homeSlot} vs ${match.awayTeam?.name ?? match.awaySlot} (${match.round.name}, ${match.kickoffAt.toISOString()})`
    );
  }

  if (promptMatches.length > 8) {
    console.log(`...and ${promptMatches.length - 8} more unlocked matches.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
