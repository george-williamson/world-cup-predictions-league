import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "final"]);
export const matchTypeEnum = pgEnum("match_type", ["group", "knockout"]);
export const predictionEnum = pgEnum("prediction", ["home", "draw", "away"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email)
  })
);

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  group: text("group_name").notNull(),
  flagUrl: text("flag_url").notNull(),
  apiFootballTeamId: integer("api_football_team_id"),
  apiFootballName: text("api_football_name"),
  apiFootballUpdatedAt: timestamp("api_football_updated_at", { withTimezone: true })
});

export const rounds = pgTable("rounds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sequence: integer("sequence").notNull(),
  type: matchTypeEnum("type").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull()
});

export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    roundId: text("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    matchNumber: integer("match_number").notNull().unique(),
    type: matchTypeEnum("type").notNull(),
    group: text("group_name"),
    homeTeamId: uuid("home_team_id").references(() => teams.id),
    awayTeamId: uuid("away_team_id").references(() => teams.id),
    homeSlot: text("home_slot").notNull(),
    awaySlot: text("away_slot").notNull(),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
    venue: text("venue").notNull(),
    status: matchStatusEnum("status").default("scheduled").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    actualOutcome: predictionEnum("actual_outcome"),
    winningTeamId: uuid("winning_team_id").references(() => teams.id),
    resultProvider: text("result_provider"),
    resultProviderFixtureId: text("result_provider_fixture_id"),
    resultUpdatedAt: timestamp("result_updated_at", { withTimezone: true }),
    oddsApiEventId: text("odds_api_event_id"),
    homeWinProbability: integer("home_win_probability"),
    drawProbability: integer("draw_probability"),
    awayWinProbability: integer("away_win_probability"),
    oddsUpdatedAt: timestamp("odds_updated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    roundIdx: index("matches_round_idx").on(table.roundId),
    kickoffIdx: index("matches_kickoff_idx").on(table.kickoffAt)
  })
);

export const predictions = pgTable(
  "predictions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    prediction: predictionEnum("prediction").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.matchId] }),
    userIdx: index("predictions_user_idx").on(table.userId),
    matchIdx: index("predictions_match_idx").on(table.matchId)
  })
);

export const oddsSnapshots = pgTable(
  "odds_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    bookmaker: text("bookmaker").notNull(),
    market: text("market").notNull(),
    homeOdds: text("home_odds"),
    drawOdds: text("draw_odds"),
    awayOdds: text("away_odds"),
    homeWinProbability: integer("home_win_probability"),
    drawProbability: integer("draw_probability"),
    awayWinProbability: integer("away_win_probability"),
    marketUpdatedAt: timestamp("market_updated_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    matchIdx: index("odds_snapshots_match_idx").on(table.matchId),
    fetchedAtIdx: index("odds_snapshots_fetched_at_idx").on(table.fetchedAt),
    providerEventIdx: index("odds_snapshots_provider_event_idx").on(table.providerEventId)
  })
);

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type OddsSnapshot = typeof oddsSnapshots.$inferSelect;
