export type SeedTeam = {
  code: string;
  name: string;
  group: string;
  flagUrl: string;
};

export type SeedRound = {
  id: string;
  name: string;
  sequence: number;
  type: "group" | "knockout";
  deadline: string;
};

export type SeedMatch = {
  id: string;
  matchNumber: number;
  roundId: string;
  type: "group" | "knockout";
  group?: string;
  homeCode?: string;
  awayCode?: string;
  homeSlot: string;
  awaySlot: string;
  kickoffAt: string;
  venue: string;
};

const flag = (countryCode: string) => `https://flagcdn.com/w160/${countryCode}.png`;

export const seedTeams: SeedTeam[] = [
  { code: "MEX", name: "Mexico", group: "A", flagUrl: flag("mx") },
  { code: "RSA", name: "South Africa", group: "A", flagUrl: flag("za") },
  { code: "KOR", name: "Korea Republic", group: "A", flagUrl: flag("kr") },
  { code: "CZE", name: "Czechia", group: "A", flagUrl: flag("cz") },
  { code: "CAN", name: "Canada", group: "B", flagUrl: flag("ca") },
  { code: "SUI", name: "Switzerland", group: "B", flagUrl: flag("ch") },
  { code: "QAT", name: "Qatar", group: "B", flagUrl: flag("qa") },
  { code: "BIH", name: "Bosnia and Herzegovina", group: "B", flagUrl: flag("ba") },
  { code: "BRA", name: "Brazil", group: "C", flagUrl: flag("br") },
  { code: "MAR", name: "Morocco", group: "C", flagUrl: flag("ma") },
  { code: "HAI", name: "Haiti", group: "C", flagUrl: flag("ht") },
  { code: "SCO", name: "Scotland", group: "C", flagUrl: flag("gb-sct") },
  { code: "USA", name: "United States", group: "D", flagUrl: flag("us") },
  { code: "PAR", name: "Paraguay", group: "D", flagUrl: flag("py") },
  { code: "AUS", name: "Australia", group: "D", flagUrl: flag("au") },
  { code: "TUR", name: "Turkiye", group: "D", flagUrl: flag("tr") },
  { code: "GER", name: "Germany", group: "E", flagUrl: flag("de") },
  { code: "CUW", name: "Curacao", group: "E", flagUrl: flag("cw") },
  { code: "CIV", name: "Cote d'Ivoire", group: "E", flagUrl: flag("ci") },
  { code: "ECU", name: "Ecuador", group: "E", flagUrl: flag("ec") },
  { code: "NED", name: "Netherlands", group: "F", flagUrl: flag("nl") },
  { code: "JPN", name: "Japan", group: "F", flagUrl: flag("jp") },
  { code: "SWE", name: "Sweden", group: "F", flagUrl: flag("se") },
  { code: "TUN", name: "Tunisia", group: "F", flagUrl: flag("tn") },
  { code: "BEL", name: "Belgium", group: "G", flagUrl: flag("be") },
  { code: "EGY", name: "Egypt", group: "G", flagUrl: flag("eg") },
  { code: "IRN", name: "Iran", group: "G", flagUrl: flag("ir") },
  { code: "NZL", name: "New Zealand", group: "G", flagUrl: flag("nz") },
  { code: "ESP", name: "Spain", group: "H", flagUrl: flag("es") },
  { code: "CPV", name: "Cape Verde", group: "H", flagUrl: flag("cv") },
  { code: "KSA", name: "Saudi Arabia", group: "H", flagUrl: flag("sa") },
  { code: "URU", name: "Uruguay", group: "H", flagUrl: flag("uy") },
  { code: "FRA", name: "France", group: "I", flagUrl: flag("fr") },
  { code: "SEN", name: "Senegal", group: "I", flagUrl: flag("sn") },
  { code: "NOR", name: "Norway", group: "I", flagUrl: flag("no") },
  { code: "IRQ", name: "Iraq", group: "I", flagUrl: flag("iq") },
  { code: "ARG", name: "Argentina", group: "J", flagUrl: flag("ar") },
  { code: "ALG", name: "Algeria", group: "J", flagUrl: flag("dz") },
  { code: "AUT", name: "Austria", group: "J", flagUrl: flag("at") },
  { code: "JOR", name: "Jordan", group: "J", flagUrl: flag("jo") },
  { code: "POR", name: "Portugal", group: "K", flagUrl: flag("pt") },
  { code: "COD", name: "DR Congo", group: "K", flagUrl: flag("cd") },
  { code: "UZB", name: "Uzbekistan", group: "K", flagUrl: flag("uz") },
  { code: "COL", name: "Colombia", group: "K", flagUrl: flag("co") },
  { code: "ENG", name: "England", group: "L", flagUrl: flag("gb-eng") },
  { code: "CRO", name: "Croatia", group: "L", flagUrl: flag("hr") },
  { code: "GHA", name: "Ghana", group: "L", flagUrl: flag("gh") },
  { code: "PAN", name: "Panama", group: "L", flagUrl: flag("pa") }
];

export const seedRounds: SeedRound[] = [
  { id: "group-1", name: "Group Stage - Round 1", sequence: 1, type: "group", deadline: "2026-06-11T19:00:00.000Z" },
  { id: "group-2", name: "Group Stage - Round 2", sequence: 2, type: "group", deadline: "2026-06-18T19:00:00.000Z" },
  { id: "group-3", name: "Group Stage - Round 3", sequence: 3, type: "group", deadline: "2026-06-24T19:00:00.000Z" },
  { id: "round-of-32", name: "Round of 32", sequence: 4, type: "knockout", deadline: "2026-06-28T19:00:00.000Z" },
  { id: "round-of-16", name: "Round of 16", sequence: 5, type: "knockout", deadline: "2026-07-04T19:00:00.000Z" },
  { id: "quarter-finals", name: "Quarter-finals", sequence: 6, type: "knockout", deadline: "2026-07-09T19:00:00.000Z" },
  { id: "semi-finals", name: "Semi-finals", sequence: 7, type: "knockout", deadline: "2026-07-14T19:00:00.000Z" },
  { id: "third-place", name: "Third-place play-off", sequence: 8, type: "knockout", deadline: "2026-07-18T19:00:00.000Z" },
  { id: "final", name: "Final", sequence: 9, type: "knockout", deadline: "2026-07-19T19:00:00.000Z" }
];

const groupVenues = [
  "Mexico City Stadium",
  "Estadio Guadalajara",
  "Toronto Stadium",
  "Los Angeles Stadium",
  "Boston Stadium",
  "BC Place Vancouver",
  "New York New Jersey Stadium",
  "San Francisco Bay Area Stadium",
  "Philadelphia Stadium",
  "Houston Stadium",
  "Dallas Stadium",
  "Estadio Monterrey",
  "Miami Stadium",
  "Seattle Stadium",
  "Kansas City Stadium",
  "Atlanta Stadium"
];

const knockoutVenues = [
  "Los Angeles Stadium",
  "Boston Stadium",
  "Mexico City Stadium",
  "Dallas Stadium",
  "Atlanta Stadium",
  "San Francisco Bay Area Stadium",
  "Seattle Stadium",
  "Miami Stadium",
  "New York New Jersey Stadium",
  "Kansas City Stadium",
  "Philadelphia Stadium",
  "Houston Stadium"
];

const pairings = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [3, 0],
  [1, 2]
] as const;

const groupRoundStart = ["2026-06-11T19:00:00.000Z", "2026-06-18T19:00:00.000Z", "2026-06-24T19:00:00.000Z"];

function buildGroupMatches(): SeedMatch[] {
  const byGroup = new Map<string, SeedTeam[]>();
  seedTeams.forEach((team) => {
    byGroup.set(team.group, [...(byGroup.get(team.group) ?? []), team]);
  });

  let matchNumber = 1;
  const matches: SeedMatch[] = [];

  [...byGroup.entries()].forEach(([group, teams], groupIndex) => {
    pairings.forEach(([homeIndex, awayIndex], pairingIndex) => {
      const roundNumber = pairingIndex < 2 ? 1 : pairingIndex < 4 ? 2 : 3;
      const start = new Date(groupRoundStart[roundNumber - 1]);
      start.setUTCDate(start.getUTCDate() + Math.floor((groupIndex * 2 + (pairingIndex % 2)) / 4));
      start.setUTCHours(17 + ((groupIndex + pairingIndex) % 4) * 2, 0, 0, 0);

      const home = teams[homeIndex];
      const away = teams[awayIndex];
      matches.push({
        id: `match-${matchNumber}`,
        matchNumber,
        roundId: `group-${roundNumber}`,
        type: "group",
        group,
        homeCode: home.code,
        awayCode: away.code,
        homeSlot: home.name,
        awaySlot: away.name,
        kickoffAt: start.toISOString(),
        venue: groupVenues[(matchNumber - 1) % groupVenues.length]
      });

      matchNumber += 1;
    });
  });

  return matches;
}

function buildKnockoutMatches(): SeedMatch[] {
  const definitions = [
    { roundId: "round-of-32", count: 16, start: 73, date: "2026-06-28T19:00:00.000Z", prefix: "Round of 32" },
    { roundId: "round-of-16", count: 8, start: 89, date: "2026-07-04T19:00:00.000Z", prefix: "Round of 16" },
    { roundId: "quarter-finals", count: 4, start: 97, date: "2026-07-09T19:00:00.000Z", prefix: "Quarter-final" },
    { roundId: "semi-finals", count: 2, start: 101, date: "2026-07-14T19:00:00.000Z", prefix: "Semi-final" },
    { roundId: "third-place", count: 1, start: 103, date: "2026-07-18T19:00:00.000Z", prefix: "Third-place" },
    { roundId: "final", count: 1, start: 104, date: "2026-07-19T19:00:00.000Z", prefix: "Final" }
  ];

  return definitions.flatMap((definition) =>
    Array.from({ length: definition.count }, (_, index) => {
      const matchNumber = definition.start + index;
      const kickoff = new Date(definition.date);
      kickoff.setUTCHours(18 + (index % 3) * 2, 0, 0, 0);

      return {
        id: `match-${matchNumber}`,
        matchNumber,
        roundId: definition.roundId,
        type: "knockout" as const,
        homeSlot: `${definition.prefix} ${index + 1} home`,
        awaySlot: `${definition.prefix} ${index + 1} away`,
        kickoffAt: kickoff.toISOString(),
        venue: knockoutVenues[index % knockoutVenues.length]
      };
    })
  );
}

export const seedMatches: SeedMatch[] = [...buildGroupMatches(), ...buildKnockoutMatches()];
