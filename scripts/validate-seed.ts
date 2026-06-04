import { seedMatches, seedRounds, seedTeams } from "@/lib/seed-data";

const teamCodes = new Set(seedTeams.map((team) => team.code));
const roundIds = new Set(seedRounds.map((round) => round.id));
const matchNumbers = new Set(seedMatches.map((match) => match.matchNumber));

const errors: string[] = [];

if (seedTeams.length !== 48) errors.push(`Expected 48 teams, found ${seedTeams.length}.`);
if (seedMatches.length !== 104) errors.push(`Expected 104 matches, found ${seedMatches.length}.`);
if (matchNumbers.size !== seedMatches.length) errors.push("Match numbers must be unique.");

for (const team of seedTeams) {
  if (!team.flagUrl) errors.push(`${team.code} is missing a flag URL.`);
}

for (const match of seedMatches) {
  if (!roundIds.has(match.roundId)) errors.push(`${match.id} references unknown round ${match.roundId}.`);
  if (match.homeCode && !teamCodes.has(match.homeCode)) errors.push(`${match.id} references unknown team ${match.homeCode}.`);
  if (match.awayCode && !teamCodes.has(match.awayCode)) errors.push(`${match.id} references unknown team ${match.awayCode}.`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Seed data is valid.");
