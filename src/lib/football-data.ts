import "server-only";
import { getTeamApiSearchName } from "@/lib/teams";

type SportsDbTeam = {
  idTeam: string;
  strTeam: string;
  strTeamBadge?: string | null;
  strLeague?: string | null;
  strCountry?: string | null;
};

type SportsDbEvent = {
  idEvent: string;
  strLeague: string;
  dateEvent: string;
  strStatus: string | null;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strVenue: string | null;
  strCity: string | null;
};

export type TeamTrackingSnapshot = {
  teamName: string;
  badgeUrl: string | null;
  competition: string | null;
  country: string | null;
  lastMatch: {
    label: string;
    date: string;
    status: string;
    venue: string | null;
  } | null;
  nextMatch: {
    label: string;
    date: string;
    status: string;
    venue: string | null;
  } | null;
};

const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

function getApiKey() {
  return process.env.THESPORTSDB_API_KEY ?? "123";
}

async function fetchSportsDb<T>(path: string) {
  const response = await fetch(`${BASE_URL}/${getApiKey()}${path}`, {
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Football API request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function formatEventLabel(event: SportsDbEvent) {
  const score =
    event.intHomeScore !== null && event.intAwayScore !== null
      ? ` ${event.intHomeScore}-${event.intAwayScore} `
      : " vs ";

  return `${event.strHomeTeam}${score}${event.strAwayTeam}`;
}

function formatVenue(event: SportsDbEvent) {
  if (event.strVenue && event.strCity) {
    return `${event.strVenue}, ${event.strCity}`;
  }

  return event.strVenue ?? event.strCity ?? null;
}

export async function getTeamTrackingSnapshot(
  assignedTeam: string,
): Promise<TeamTrackingSnapshot | null> {
  const query = encodeURIComponent(getTeamApiSearchName(assignedTeam));
  const search = await fetchSportsDb<{ teams: SportsDbTeam[] | null }>(
    `/searchteams.php?t=${query}`,
  );
  const team = search.teams?.[0];

  if (!team) {
    return null;
  }

  const [lastResult, nextResult] = await Promise.all([
    fetchSportsDb<{ results: SportsDbEvent[] | null }>(`/eventslast.php?id=${team.idTeam}`),
    fetchSportsDb<{ events: SportsDbEvent[] | null }>(`/eventsnext.php?id=${team.idTeam}`),
  ]);

  const lastMatch = lastResult.results?.[0] ?? null;
  const nextMatch = nextResult.events?.[0] ?? null;

  return {
    teamName: team.strTeam,
    badgeUrl: team.strTeamBadge ?? null,
    competition: team.strLeague ?? null,
    country: team.strCountry ?? null,
    lastMatch: lastMatch
      ? {
          label: formatEventLabel(lastMatch),
          date: lastMatch.dateEvent,
          status: lastMatch.strStatus ?? "Completed",
          venue: formatVenue(lastMatch),
        }
      : null,
    nextMatch: nextMatch
      ? {
          label: formatEventLabel(nextMatch),
          date: nextMatch.dateEvent,
          status: nextMatch.strStatus ?? "Scheduled",
          venue: formatVenue(nextMatch),
        }
      : null,
  };
}
