import { loadLocalEnv } from "@/lib/load-env";
import { syncOdds } from "@/lib/sync/odds";

loadLocalEnv();

syncOdds()
  .then((summary) => {
    console.log(
      `Fetched ${summary.fetched} ${summary.sportKey} odds events. Matched ${summary.matched}/${summary.fixtureCount} fixtures (${summary.dateMatched} date+teams, ${summary.pairMatched} teams-only) and updated odds for ${summary.updated}.`
    );

    if (summary.unmatched.length > 0) {
      console.log("First unmatched seeded fixtures:");
      for (const match of summary.unmatched.slice(0, 8)) {
        console.log(`- ${match.kickoffDate}: ${match.home} vs ${match.away}`);
      }
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
