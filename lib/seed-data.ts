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

const espnTeamCode: Record<string, string> = {
  "Algeria": "ALG",
  "Argentina": "ARG",
  "Australia": "AUS",
  "Austria": "AUT",
  "Belgium": "BEL",
  "Bosnia-Herzegovina": "BIH",
  "Brazil": "BRA",
  "Canada": "CAN",
  "Cape Verde": "CPV",
  "Colombia": "COL",
  "Congo DR": "COD",
  "Croatia": "CRO",
  "Curaçao": "CUW",
  "Czechia": "CZE",
  "Ecuador": "ECU",
  "Egypt": "EGY",
  "England": "ENG",
  "France": "FRA",
  "Germany": "GER",
  "Ghana": "GHA",
  "Haiti": "HAI",
  "Iran": "IRN",
  "Iraq": "IRQ",
  "Ivory Coast": "CIV",
  "Japan": "JPN",
  "Jordan": "JOR",
  "Mexico": "MEX",
  "Morocco": "MAR",
  "Netherlands": "NED",
  "New Zealand": "NZL",
  "Norway": "NOR",
  "Panama": "PAN",
  "Paraguay": "PAR",
  "Portugal": "POR",
  "Qatar": "QAT",
  "Saudi Arabia": "KSA",
  "Scotland": "SCO",
  "Senegal": "SEN",
  "South Africa": "RSA",
  "South Korea": "KOR",
  "Spain": "ESP",
  "Sweden": "SWE",
  "Switzerland": "SUI",
  "Tunisia": "TUN",
  "Türkiye": "TUR",
  "United States": "USA",
  "Uruguay": "URU",
  "Uzbekistan": "UZB"
};

type ScheduledFixture = {
  kickoffAt: string;
  home: string;
  away: string;
  venue: string;
};

const groupFixtures: ScheduledFixture[] = [
  { kickoffAt: "2026-06-11T19:00:00.000Z", home: "Mexico", away: "South Africa", venue: "Estadio Banorte, Mexico City" },
  { kickoffAt: "2026-06-12T02:00:00.000Z", home: "South Korea", away: "Czechia", venue: "Estadio Akron, Guadalajara" },
  { kickoffAt: "2026-06-12T19:00:00.000Z", home: "Canada", away: "Bosnia-Herzegovina", venue: "BMO Field, Toronto" },
  { kickoffAt: "2026-06-13T01:00:00.000Z", home: "United States", away: "Paraguay", venue: "SoFi Stadium, Inglewood, California" },
  { kickoffAt: "2026-06-13T19:00:00.000Z", home: "Qatar", away: "Switzerland", venue: "Levi's Stadium, Santa Clara, California" },
  { kickoffAt: "2026-06-13T22:00:00.000Z", home: "Brazil", away: "Morocco", venue: "MetLife Stadium, East Rutherford, New Jersey" },
  { kickoffAt: "2026-06-14T01:00:00.000Z", home: "Haiti", away: "Scotland", venue: "Gillette Stadium, Foxborough, Massachusetts" },
  { kickoffAt: "2026-06-14T04:00:00.000Z", home: "Australia", away: "Türkiye", venue: "BC Place, Vancouver" },
  { kickoffAt: "2026-06-14T17:00:00.000Z", home: "Germany", away: "Curaçao", venue: "NRG Stadium, Houston, Texas" },
  { kickoffAt: "2026-06-14T20:00:00.000Z", home: "Netherlands", away: "Japan", venue: "AT&T Stadium, Arlington, Texas" },
  { kickoffAt: "2026-06-14T23:00:00.000Z", home: "Ivory Coast", away: "Ecuador", venue: "Lincoln Financial Field, Philadelphia, Pennsylvania" },
  { kickoffAt: "2026-06-15T02:00:00.000Z", home: "Sweden", away: "Tunisia", venue: "Estadio BBVA, Guadalupe" },
  { kickoffAt: "2026-06-15T16:00:00.000Z", home: "Spain", away: "Cape Verde", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { kickoffAt: "2026-06-15T19:00:00.000Z", home: "Belgium", away: "Egypt", venue: "Lumen Field, Seattle, Washington" },
  { kickoffAt: "2026-06-15T22:00:00.000Z", home: "Saudi Arabia", away: "Uruguay", venue: "Hard Rock Stadium, Miami Gardens, Florida" },
  { kickoffAt: "2026-06-16T01:00:00.000Z", home: "Iran", away: "New Zealand", venue: "SoFi Stadium, Inglewood, California" },
  { kickoffAt: "2026-06-16T19:00:00.000Z", home: "France", away: "Senegal", venue: "MetLife Stadium, East Rutherford, New Jersey" },
  { kickoffAt: "2026-06-16T22:00:00.000Z", home: "Iraq", away: "Norway", venue: "Gillette Stadium, Foxborough, Massachusetts" },
  { kickoffAt: "2026-06-17T01:00:00.000Z", home: "Argentina", away: "Algeria", venue: "GEHA Field at Arrowhead Stadium, Kansas City, Missouri" },
  { kickoffAt: "2026-06-17T04:00:00.000Z", home: "Austria", away: "Jordan", venue: "Levi's Stadium, Santa Clara, California" },
  { kickoffAt: "2026-06-17T17:00:00.000Z", home: "Portugal", away: "Congo DR", venue: "NRG Stadium, Houston, Texas" },
  { kickoffAt: "2026-06-17T20:00:00.000Z", home: "England", away: "Croatia", venue: "AT&T Stadium, Arlington, Texas" },
  { kickoffAt: "2026-06-17T23:00:00.000Z", home: "Ghana", away: "Panama", venue: "BMO Field, Toronto" },
  { kickoffAt: "2026-06-18T02:00:00.000Z", home: "Uzbekistan", away: "Colombia", venue: "Estadio Banorte, Mexico City" },
  { kickoffAt: "2026-06-18T16:00:00.000Z", home: "Czechia", away: "South Africa", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { kickoffAt: "2026-06-18T19:00:00.000Z", home: "Switzerland", away: "Bosnia-Herzegovina", venue: "SoFi Stadium, Inglewood, California" },
  { kickoffAt: "2026-06-18T22:00:00.000Z", home: "Canada", away: "Qatar", venue: "BC Place, Vancouver" },
  { kickoffAt: "2026-06-19T01:00:00.000Z", home: "Mexico", away: "South Korea", venue: "Estadio Akron, Guadalajara" },
  { kickoffAt: "2026-06-19T19:00:00.000Z", home: "United States", away: "Australia", venue: "Lumen Field, Seattle, Washington" },
  { kickoffAt: "2026-06-19T22:00:00.000Z", home: "Scotland", away: "Morocco", venue: "Gillette Stadium, Foxborough, Massachusetts" },
  { kickoffAt: "2026-06-20T00:30:00.000Z", home: "Brazil", away: "Haiti", venue: "Lincoln Financial Field, Philadelphia, Pennsylvania" },
  { kickoffAt: "2026-06-20T03:00:00.000Z", home: "Türkiye", away: "Paraguay", venue: "Levi's Stadium, Santa Clara, California" },
  { kickoffAt: "2026-06-20T17:00:00.000Z", home: "Netherlands", away: "Sweden", venue: "NRG Stadium, Houston, Texas" },
  { kickoffAt: "2026-06-20T20:00:00.000Z", home: "Germany", away: "Ivory Coast", venue: "BMO Field, Toronto" },
  { kickoffAt: "2026-06-21T00:00:00.000Z", home: "Ecuador", away: "Curaçao", venue: "GEHA Field at Arrowhead Stadium, Kansas City, Missouri" },
  { kickoffAt: "2026-06-21T04:00:00.000Z", home: "Tunisia", away: "Japan", venue: "Estadio BBVA, Guadalupe" },
  { kickoffAt: "2026-06-21T16:00:00.000Z", home: "Spain", away: "Saudi Arabia", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { kickoffAt: "2026-06-21T19:00:00.000Z", home: "Belgium", away: "Iran", venue: "SoFi Stadium, Inglewood, California" },
  { kickoffAt: "2026-06-21T22:00:00.000Z", home: "Uruguay", away: "Cape Verde", venue: "Hard Rock Stadium, Miami Gardens, Florida" },
  { kickoffAt: "2026-06-22T01:00:00.000Z", home: "New Zealand", away: "Egypt", venue: "BC Place, Vancouver" },
  { kickoffAt: "2026-06-22T17:00:00.000Z", home: "Argentina", away: "Austria", venue: "AT&T Stadium, Arlington, Texas" },
  { kickoffAt: "2026-06-22T21:00:00.000Z", home: "France", away: "Iraq", venue: "Lincoln Financial Field, Philadelphia, Pennsylvania" },
  { kickoffAt: "2026-06-23T00:00:00.000Z", home: "Norway", away: "Senegal", venue: "MetLife Stadium, East Rutherford, New Jersey" },
  { kickoffAt: "2026-06-23T03:00:00.000Z", home: "Jordan", away: "Algeria", venue: "Levi's Stadium, Santa Clara, California" },
  { kickoffAt: "2026-06-23T17:00:00.000Z", home: "Portugal", away: "Uzbekistan", venue: "NRG Stadium, Houston, Texas" },
  { kickoffAt: "2026-06-23T20:00:00.000Z", home: "England", away: "Ghana", venue: "Gillette Stadium, Foxborough, Massachusetts" },
  { kickoffAt: "2026-06-23T23:00:00.000Z", home: "Panama", away: "Croatia", venue: "BMO Field, Toronto" },
  { kickoffAt: "2026-06-24T02:00:00.000Z", home: "Colombia", away: "Congo DR", venue: "Estadio Akron, Guadalajara" },
  { kickoffAt: "2026-06-24T19:00:00.000Z", home: "Bosnia-Herzegovina", away: "Qatar", venue: "Lumen Field, Seattle, Washington" },
  { kickoffAt: "2026-06-24T19:00:00.000Z", home: "Switzerland", away: "Canada", venue: "BC Place, Vancouver" },
  { kickoffAt: "2026-06-24T22:00:00.000Z", home: "Morocco", away: "Haiti", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { kickoffAt: "2026-06-24T22:00:00.000Z", home: "Scotland", away: "Brazil", venue: "Hard Rock Stadium, Miami Gardens, Florida" },
  { kickoffAt: "2026-06-25T01:00:00.000Z", home: "Czechia", away: "Mexico", venue: "Estadio Banorte, Mexico City" },
  { kickoffAt: "2026-06-25T01:00:00.000Z", home: "South Africa", away: "South Korea", venue: "Estadio BBVA, Guadalupe" },
  { kickoffAt: "2026-06-25T20:00:00.000Z", home: "Curaçao", away: "Ivory Coast", venue: "Lincoln Financial Field, Philadelphia, Pennsylvania" },
  { kickoffAt: "2026-06-25T20:00:00.000Z", home: "Ecuador", away: "Germany", venue: "MetLife Stadium, East Rutherford, New Jersey" },
  { kickoffAt: "2026-06-25T23:00:00.000Z", home: "Japan", away: "Sweden", venue: "AT&T Stadium, Arlington, Texas" },
  { kickoffAt: "2026-06-25T23:00:00.000Z", home: "Tunisia", away: "Netherlands", venue: "GEHA Field at Arrowhead Stadium, Kansas City, Missouri" },
  { kickoffAt: "2026-06-26T02:00:00.000Z", home: "Paraguay", away: "Australia", venue: "Levi's Stadium, Santa Clara, California" },
  { kickoffAt: "2026-06-26T02:00:00.000Z", home: "Türkiye", away: "United States", venue: "SoFi Stadium, Inglewood, California" },
  { kickoffAt: "2026-06-26T19:00:00.000Z", home: "Norway", away: "France", venue: "Gillette Stadium, Foxborough, Massachusetts" },
  { kickoffAt: "2026-06-26T19:00:00.000Z", home: "Senegal", away: "Iraq", venue: "BMO Field, Toronto" },
  { kickoffAt: "2026-06-27T00:00:00.000Z", home: "Cape Verde", away: "Saudi Arabia", venue: "NRG Stadium, Houston, Texas" },
  { kickoffAt: "2026-06-27T00:00:00.000Z", home: "Uruguay", away: "Spain", venue: "Estadio Akron, Guadalajara" },
  { kickoffAt: "2026-06-27T03:00:00.000Z", home: "Egypt", away: "Iran", venue: "Lumen Field, Seattle, Washington" },
  { kickoffAt: "2026-06-27T03:00:00.000Z", home: "New Zealand", away: "Belgium", venue: "BC Place, Vancouver" },
  { kickoffAt: "2026-06-27T21:00:00.000Z", home: "Croatia", away: "Ghana", venue: "Lincoln Financial Field, Philadelphia, Pennsylvania" },
  { kickoffAt: "2026-06-27T21:00:00.000Z", home: "Panama", away: "England", venue: "MetLife Stadium, East Rutherford, New Jersey" },
  { kickoffAt: "2026-06-27T23:30:00.000Z", home: "Colombia", away: "Portugal", venue: "Hard Rock Stadium, Miami Gardens, Florida" },
  { kickoffAt: "2026-06-27T23:30:00.000Z", home: "Congo DR", away: "Uzbekistan", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { kickoffAt: "2026-06-28T02:00:00.000Z", home: "Algeria", away: "Austria", venue: "GEHA Field at Arrowhead Stadium, Kansas City, Missouri" },
  { kickoffAt: "2026-06-28T02:00:00.000Z", home: "Jordan", away: "Argentina", venue: "AT&T Stadium, Arlington, Texas" }
];

const knockoutFixtures: Array<ScheduledFixture & { roundId: SeedRound["id"] }> = [
  { roundId: "round-of-32", kickoffAt: "2026-06-28T19:00:00.000Z", home: "Group A 2nd Place", away: "Group B 2nd Place", venue: "SoFi Stadium, Inglewood, California" },
  { roundId: "round-of-32", kickoffAt: "2026-06-29T17:00:00.000Z", home: "Group C Winner", away: "Group F 2nd Place", venue: "NRG Stadium, Houston, Texas" },
  { roundId: "round-of-32", kickoffAt: "2026-06-29T20:30:00.000Z", home: "Group E Winner", away: "Third Place Group A/B/C/D/F", venue: "Gillette Stadium, Foxborough, Massachusetts" },
  { roundId: "round-of-32", kickoffAt: "2026-06-30T01:00:00.000Z", home: "Group F Winner", away: "Group C 2nd Place", venue: "Estadio BBVA, Guadalupe" },
  { roundId: "round-of-32", kickoffAt: "2026-06-30T17:00:00.000Z", home: "Group E 2nd Place", away: "Group I 2nd Place", venue: "AT&T Stadium, Arlington, Texas" },
  { roundId: "round-of-32", kickoffAt: "2026-06-30T21:00:00.000Z", home: "Group I Winner", away: "Third Place Group C/D/F/G/H", venue: "MetLife Stadium, East Rutherford, New Jersey" },
  { roundId: "round-of-32", kickoffAt: "2026-07-01T01:00:00.000Z", home: "Group A Winner", away: "Third Place Group C/E/F/H/I", venue: "Estadio Banorte, Mexico City" },
  { roundId: "round-of-32", kickoffAt: "2026-07-01T16:00:00.000Z", home: "Group L Winner", away: "Third Place Group E/H/I/J/K", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { roundId: "round-of-32", kickoffAt: "2026-07-01T20:00:00.000Z", home: "Group G Winner", away: "Third Place Group A/E/H/I/J", venue: "Lumen Field, Seattle, Washington" },
  { roundId: "round-of-32", kickoffAt: "2026-07-02T00:00:00.000Z", home: "Group D Winner", away: "Third Place Group B/E/F/I/J", venue: "Levi's Stadium, Santa Clara, California" },
  { roundId: "round-of-32", kickoffAt: "2026-07-02T19:00:00.000Z", home: "Group H Winner", away: "Group J 2nd Place", venue: "SoFi Stadium, Inglewood, California" },
  { roundId: "round-of-32", kickoffAt: "2026-07-02T23:00:00.000Z", home: "Group K 2nd Place", away: "Group L 2nd Place", venue: "BMO Field, Toronto" },
  { roundId: "round-of-32", kickoffAt: "2026-07-03T03:00:00.000Z", home: "Group B Winner", away: "Third Place Group E/F/G/I/J", venue: "BC Place, Vancouver" },
  { roundId: "round-of-32", kickoffAt: "2026-07-03T18:00:00.000Z", home: "Group D 2nd Place", away: "Group G 2nd Place", venue: "AT&T Stadium, Arlington, Texas" },
  { roundId: "round-of-32", kickoffAt: "2026-07-03T22:00:00.000Z", home: "Group J Winner", away: "Group H 2nd Place", venue: "Hard Rock Stadium, Miami Gardens, Florida" },
  { roundId: "round-of-32", kickoffAt: "2026-07-04T01:30:00.000Z", home: "Group K Winner", away: "Third Place Group D/E/I/J/L", venue: "GEHA Field at Arrowhead Stadium, Kansas City, Missouri" },
  { roundId: "round-of-16", kickoffAt: "2026-07-04T17:00:00.000Z", home: "Round of 32 1 Winner", away: "Round of 32 3 Winner", venue: "NRG Stadium, Houston, Texas" },
  { roundId: "round-of-16", kickoffAt: "2026-07-04T21:00:00.000Z", home: "Round of 32 2 Winner", away: "Round of 32 5 Winner", venue: "Lincoln Financial Field, Philadelphia, Pennsylvania" },
  { roundId: "round-of-16", kickoffAt: "2026-07-05T20:00:00.000Z", home: "Round of 32 4 Winner", away: "Round of 32 6 Winner", venue: "MetLife Stadium, East Rutherford, New Jersey" },
  { roundId: "round-of-16", kickoffAt: "2026-07-06T00:00:00.000Z", home: "Round of 32 7 Winner", away: "Round of 32 8 Winner", venue: "Estadio Banorte, Mexico City" },
  { roundId: "round-of-16", kickoffAt: "2026-07-06T19:00:00.000Z", home: "Round of 32 11 Winner", away: "Round of 32 12 Winner", venue: "AT&T Stadium, Arlington, Texas" },
  { roundId: "round-of-16", kickoffAt: "2026-07-07T00:00:00.000Z", home: "Round of 32 9 Winner", away: "Round of 32 10 Winner", venue: "Lumen Field, Seattle, Washington" },
  { roundId: "round-of-16", kickoffAt: "2026-07-07T16:00:00.000Z", home: "Round of 32 14 Winner", away: "Round of 32 16 Winner", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { roundId: "round-of-16", kickoffAt: "2026-07-07T20:00:00.000Z", home: "Round of 32 13 Winner", away: "Round of 32 15 Winner", venue: "BC Place, Vancouver" },
  { roundId: "quarter-finals", kickoffAt: "2026-07-09T20:00:00.000Z", home: "Round of 16 1 Winner", away: "Round of 16 2 Winner", venue: "Gillette Stadium, Foxborough, Massachusetts" },
  { roundId: "quarter-finals", kickoffAt: "2026-07-10T19:00:00.000Z", home: "Round of 16 5 Winner", away: "Round of 16 6 Winner", venue: "SoFi Stadium, Inglewood, California" },
  { roundId: "quarter-finals", kickoffAt: "2026-07-11T21:00:00.000Z", home: "Round of 16 3 Winner", away: "Round of 16 4 Winner", venue: "Hard Rock Stadium, Miami Gardens, Florida" },
  { roundId: "quarter-finals", kickoffAt: "2026-07-12T01:00:00.000Z", home: "Round of 16 7 Winner", away: "Round of 16 8 Winner", venue: "GEHA Field at Arrowhead Stadium, Kansas City, Missouri" },
  { roundId: "semi-finals", kickoffAt: "2026-07-14T19:00:00.000Z", home: "Quarterfinal 1 Winner", away: "Quarterfinal 2 Winner", venue: "AT&T Stadium, Arlington, Texas" },
  { roundId: "semi-finals", kickoffAt: "2026-07-15T19:00:00.000Z", home: "Quarterfinal 3 Winner", away: "Quarterfinal 4 Winner", venue: "Mercedes-Benz Stadium, Atlanta, Georgia" },
  { roundId: "third-place", kickoffAt: "2026-07-18T21:00:00.000Z", home: "Semifinal 1 Loser", away: "Semifinal 2 Loser", venue: "Hard Rock Stadium, Miami Gardens, Florida" },
  { roundId: "final", kickoffAt: "2026-07-19T19:00:00.000Z", home: "Semifinal 1 Winner", away: "Semifinal 2 Winner", venue: "MetLife Stadium, East Rutherford, New Jersey" }
];

const roundDeadlines: Record<SeedRound["id"], string> = {
  "group-1": "2026-06-11T19:00:00.000Z",
  "group-2": "2026-06-18T16:00:00.000Z",
  "group-3": "2026-06-24T19:00:00.000Z",
  "round-of-32": "2026-06-28T19:00:00.000Z",
  "round-of-16": "2026-07-04T17:00:00.000Z",
  "quarter-finals": "2026-07-09T20:00:00.000Z",
  "semi-finals": "2026-07-14T19:00:00.000Z",
  "third-place": "2026-07-18T21:00:00.000Z",
  "final": "2026-07-19T19:00:00.000Z"
};

function roundIdForGroupFixture(index: number): SeedRound["id"] {
  if (index < 24) return "group-1";
  if (index < 48) return "group-2";
  return "group-3";
}

function buildGroupMatches(): SeedMatch[] {
  return groupFixtures.map((fixture, index) => {
    const homeCode = espnTeamCode[fixture.home];
    const awayCode = espnTeamCode[fixture.away];
    const home = seedTeams.find((team) => team.code === homeCode);
    const away = seedTeams.find((team) => team.code === awayCode);

    if (!home || !away) {
      throw new Error(`Unknown team in fixture: ${fixture.home} vs ${fixture.away}`);
    }

    return {
      id: `match-${index + 1}`,
      matchNumber: index + 1,
      roundId: roundIdForGroupFixture(index),
      type: "group",
      group: home.group,
      homeCode: home.code,
      awayCode: away.code,
      homeSlot: home.name,
      awaySlot: away.name,
      kickoffAt: fixture.kickoffAt,
      venue: fixture.venue
    };
  });
}

function buildKnockoutMatches(): SeedMatch[] {
  return knockoutFixtures.map((fixture, index) => {
    const matchNumber = 73 + index;

    return {
      id: `match-${matchNumber}`,
      matchNumber,
      roundId: fixture.roundId,
      type: "knockout" as const,
      homeSlot: fixture.home,
      awaySlot: fixture.away,
      kickoffAt: fixture.kickoffAt,
      venue: fixture.venue
    };
  });
}

export const seedRounds: SeedRound[] = [
  { id: "group-1", name: "Group Stage - Round 1", sequence: 1, type: "group", deadline: roundDeadlines["group-1"] },
  { id: "group-2", name: "Group Stage - Round 2", sequence: 2, type: "group", deadline: roundDeadlines["group-2"] },
  { id: "group-3", name: "Group Stage - Round 3", sequence: 3, type: "group", deadline: roundDeadlines["group-3"] },
  { id: "round-of-32", name: "Round of 32", sequence: 4, type: "knockout", deadline: roundDeadlines["round-of-32"] },
  { id: "round-of-16", name: "Round of 16", sequence: 5, type: "knockout", deadline: roundDeadlines["round-of-16"] },
  { id: "quarter-finals", name: "Quarter-finals", sequence: 6, type: "knockout", deadline: roundDeadlines["quarter-finals"] },
  { id: "semi-finals", name: "Semi-finals", sequence: 7, type: "knockout", deadline: roundDeadlines["semi-finals"] },
  { id: "third-place", name: "Third-place play-off", sequence: 8, type: "knockout", deadline: roundDeadlines["third-place"] },
  { id: "final", name: "Final", sequence: 9, type: "knockout", deadline: roundDeadlines.final }
];

export const seedMatches: SeedMatch[] = [...buildGroupMatches(), ...buildKnockoutMatches()];
