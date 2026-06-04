import { seedDatabase } from "@/lib/queries";

async function main() {
  const result = await seedDatabase();
  console.log(`Seeded ${result.teams} teams, ${result.rounds} rounds and ${result.matches} matches.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
