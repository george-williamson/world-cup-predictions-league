import { loadLocalEnv } from "@/lib/load-env";
import { syncResultsForDate } from "@/lib/sync/results";

loadLocalEnv();

const dateArg = readDateArg();

syncResultsForDate(dateArg)
  .then((summary) => {
    console.log(
      `Fetched ${summary.fetched} finished API-Football fixtures for ${summary.date}. Matched ${summary.matched}/${summary.seededFixtureCount} seeded fixtures and updated ${summary.updated}.`
    );

    if (summary.unmatched.length > 0) {
      console.log("Unmatched seeded fixtures:");
      for (const match of summary.unmatched.slice(0, 8)) {
        console.log(`- ${match.matchId}: ${match.home} vs ${match.away}`);
      }
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function readDateArg() {
  const args = process.argv.slice(2);
  const equalsArg = args.find((arg) => arg.startsWith("--date="));
  if (equalsArg) return equalsArg.split("=")[1];

  const dateFlagIndex = args.indexOf("--date");
  if (dateFlagIndex !== -1) return args[dateFlagIndex + 1] ?? "";

  return args[0] ?? todayIsoDate();
}
