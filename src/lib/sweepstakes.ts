import { randomInt } from "crypto";
import { hashPin, validatePin, verifyPin } from "@/lib/auth";
import { ENTRY_FEE, MAX_PARTICIPANTS } from "@/lib/constants";
import { query, queryOne, hasAdminAccess, isDatabaseConfigured } from "@/lib/db";
import { getTeamTrackingSnapshot, type TeamTrackingSnapshot } from "@/lib/football-data";
import { WORLD_CUP_TEAMS } from "@/lib/teams";

const WORLD_CUP_TEAM_SET = new Set<string>(WORLD_CUP_TEAMS);

export type ParticipantStatus = "pending" | "active" | "eliminated" | "winner";

export type ParticipantRow = {
  id: string;
  full_name: string;
  email: string;
  department: string;
  phone: string;
  location: string;
  team_preferences: string[];
  assigned_team: string | null;
  assignment_rank: number | null;
  payment_confirmed: boolean;
  status: ParticipantStatus;
  elimination_message: string | null;
  created_at: string;
  updated_at: string;
};

export type SignupInput = {
  fullName: string;
  email: string;
  department: string;
  phone: string;
  location: string;
  pin: string;
  teamPreferences: string[];
};

export type SweepstakeSummary = {
  acceptedCount: number;
  remainingSpots: number;
  isFull: boolean;
  totalSpots: number;
  entryFee: number;
  drawCompleted: boolean;
  configured: boolean;
  adminConfigured: boolean;
  participants: Array<{
    id: string;
    fullName: string;
    department: string;
    location: string;
    teamPreferences: string[];
    assignedTeam: string | null;
    status: ParticipantStatus;
    eliminationMessage: string | null;
    createdAt: string;
  }>;
  eliminatedParticipants: Array<{
    id: string;
    fullName: string;
    assignedTeam: string | null;
    eliminationMessage: string | null;
  }>;
};

export type ParticipantTracker = {
  participant: {
    fullName: string;
    email: string;
    assignedTeam: string | null;
    teamPreferences: string[];
    status: ParticipantStatus;
    eliminationMessage: string | null;
    assignmentRank: number | null;
  };
  teamSnapshot: TeamTrackingSnapshot | null;
  eliminatedParticipants: Array<{
    id: string;
    fullName: string;
    assignedTeam: string | null;
    eliminationMessage: string | null;
  }>;
};

type ParticipantAuthRow = {
  email: string;
  full_name: string;
  pin_hash: string | null;
};

function getFallbackSummary(): SweepstakeSummary {
  return {
    acceptedCount: 0,
    remainingSpots: MAX_PARTICIPANTS,
    isFull: false,
    totalSpots: MAX_PARTICIPANTS,
    entryFee: ENTRY_FEE,
    drawCompleted: false,
    configured: false,
    adminConfigured: false,
    participants: [],
    eliminatedParticipants: [],
  };
}

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEmail(email: string) {
  return normalizeValue(email).toLowerCase();
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function buildEliminationMessage(teamName: string) {
  const messages = [
    `${teamName} packed their bags early. Respectfully, that is hilarious.`,
    `${teamName} have been knocked out. The group chat may now begin its work.`,
    `${teamName} are out. Time to blame tactics, luck, and maybe the socks.`,
    `${teamName} just got sent home. Thoughts and playful laughter.`,
    `${teamName} are done. Please collect your banter at the nearest exit.`,
  ];

  return messages[randomInt(messages.length)];
}

function validatePreferences(preferences: string[]) {
  const cleaned = preferences.map(normalizeValue).filter(Boolean);

  if (cleaned.length === 0 || cleaned.length > 3) {
    throw new Error("Choose between 1 and 3 preferred teams.");
  }

  const unique = Array.from(new Set(cleaned));

  if (unique.length !== cleaned.length) {
    throw new Error("Each preferred team must be different.");
  }

  if (!unique.every((team) => WORLD_CUP_TEAM_SET.has(team))) {
    throw new Error("One or more selected teams are not in the tournament list.");
  }

  return unique;
}

function validateSignup(input: SignupInput) {
  const cleaned = {
    fullName: normalizeValue(input.fullName),
    email: normalizeEmail(input.email),
    department: normalizeValue(input.department),
    phone: normalizeValue(input.phone),
    location: normalizeValue(input.location),
    pin: validatePin(input.pin),
    teamPreferences: validatePreferences(input.teamPreferences),
  };

  if (
    !cleaned.fullName ||
    !cleaned.email ||
    !cleaned.department ||
    !cleaned.phone ||
    !cleaned.location
  ) {
    throw new Error("Please complete every field before submitting.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
    throw new Error("Please enter a valid email address.");
  }

  return cleaned;
}

async function readParticipants() {
  if (!isDatabaseConfigured()) {
    return [] as ParticipantRow[];
  }

  const result = await query<ParticipantRow>(
    `select
      id,
      full_name,
      email,
      department,
      phone,
      location,
      team_preferences,
      assigned_team,
      assignment_rank,
      payment_confirmed,
      status,
      elimination_message,
      created_at::text,
      updated_at::text
    from participants
    order by created_at asc`,
  );

  return result.rows;
}

async function readParticipantByEmail(email: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  return queryOne<ParticipantRow>(
    `select
      id,
      full_name,
      email,
      department,
      phone,
      location,
      team_preferences,
      assigned_team,
      assignment_rank,
      payment_confirmed,
      status,
      elimination_message,
      created_at::text,
      updated_at::text
    from participants
    where email = $1`,
    [normalizeEmail(email)],
  );
}

async function readParticipantAuthByEmail(email: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  return queryOne<ParticipantAuthRow>(
    `select email, full_name, pin_hash
    from participants
    where email = $1`,
    [normalizeEmail(email)],
  );
}

export async function getSweepstakeSummary(): Promise<SweepstakeSummary> {
  const fallbackSummary = getFallbackSummary();

  if (!isDatabaseConfigured()) {
    return fallbackSummary;
  }

  let participants: ParticipantRow[];

  try {
    participants = await readParticipants();
  } catch {
    return fallbackSummary;
  }

  return {
    acceptedCount: participants.length,
    remainingSpots: Math.max(0, MAX_PARTICIPANTS - participants.length),
    isFull: participants.length >= MAX_PARTICIPANTS,
    totalSpots: MAX_PARTICIPANTS,
    entryFee: ENTRY_FEE,
    drawCompleted: participants.some((participant) => Boolean(participant.assigned_team)),
    configured: true,
    adminConfigured: hasAdminAccess(),
    participants: participants.map((participant) => ({
      id: participant.id,
      fullName: participant.full_name,
      department: participant.department,
      location: participant.location,
      teamPreferences: participant.team_preferences,
      assignedTeam: participant.assigned_team,
      status: participant.status,
      eliminationMessage: participant.elimination_message,
      createdAt: participant.created_at,
    })),
    eliminatedParticipants: participants
      .filter((participant) => participant.status === "eliminated")
      .map((participant) => ({
        id: participant.id,
        fullName: participant.full_name,
        assignedTeam: participant.assigned_team,
        eliminationMessage: participant.elimination_message,
      })),
  };
}

export async function createSignup(input: SignupInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured yet.");
  }

  const cleaned = validateSignup(input);
  const participants = await readParticipants();

  if (
    participants.some(
      (participant) => normalizeEmail(participant.email) === cleaned.email,
    )
  ) {
    const error = new Error("This email has already been used for an entry.");
    error.name = "DUPLICATE_ENTRY";
    throw error;
  }

  if (participants.length >= MAX_PARTICIPANTS) {
    const error = new Error(
      "The first 48 places have already been claimed for this sweepstake.",
    );
    error.name = "SWEEPSTAKE_FULL";
    throw error;
  }

  try {
    await query(
      `insert into participants (
        full_name,
        email,
        department,
        phone,
        location,
        pin_hash,
        team_preferences
      ) values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        cleaned.fullName,
        cleaned.email,
        cleaned.department,
        cleaned.phone,
        cleaned.location,
        hashPin(cleaned.pin),
        cleaned.teamPreferences,
      ],
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      const duplicateError = new Error(
        "This email has already been used for an entry.",
      );
      duplicateError.name = "DUPLICATE_ENTRY";
      throw duplicateError;
    }

    throw error;
  }

  return {
    summary: await getSweepstakeSummary(),
  };
}

export async function authenticateParticipant(email: string, pin: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured yet.");
  }

  const participant = await readParticipantAuthByEmail(email);
  const cleanedPin = validatePin(pin);

  if (!participant || !verifyPin(cleanedPin, participant.pin_hash)) {
    const error = new Error("Invalid email or PIN.");
    error.name = "UNAUTHORIZED";
    throw error;
  }

  return {
    email: participant.email,
    fullName: participant.full_name,
  };
}

export async function getParticipantTracker(email: string): Promise<ParticipantTracker> {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured yet.");
  }

  const participant = await readParticipantByEmail(email);

  if (!participant) {
    throw new Error("No signup was found for that email address.");
  }

  const teamSnapshot = participant.assigned_team
    ? await getTeamTrackingSnapshot(participant.assigned_team)
    : null;
  const summary = await getSweepstakeSummary();

  return {
    participant: {
      fullName: participant.full_name,
      email: participant.email,
      assignedTeam: participant.assigned_team,
      teamPreferences: participant.team_preferences,
      status: participant.status,
      eliminationMessage: participant.elimination_message,
      assignmentRank: participant.assignment_rank,
    },
    teamSnapshot,
    eliminatedParticipants: summary.eliminatedParticipants,
  };
}

export async function runDraw() {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured yet.");
  }

  const participants = await readParticipants();

  if (participants.length !== MAX_PARTICIPANTS) {
    throw new Error("The draw can only run once all 48 participant slots are filled.");
  }

  if (participants.some((participant) => participant.assigned_team)) {
    throw new Error("The draw has already been completed.");
  }

  const pendingAssignments = new Map<string, { team: string; rank: number | null }>();
  const remainingTeams = new Set<string>(WORLD_CUP_TEAMS);
  let unassigned = shuffle(participants);

  for (let preferenceIndex = 0; preferenceIndex < 3; preferenceIndex += 1) {
    const nextRound: ParticipantRow[] = [];

    for (const participant of unassigned) {
      const preferredTeam = participant.team_preferences[preferenceIndex];

      if (preferredTeam && remainingTeams.has(preferredTeam)) {
        pendingAssignments.set(participant.id, {
          team: preferredTeam,
          rank: preferenceIndex + 1,
        });
        remainingTeams.delete(preferredTeam);
      } else {
        nextRound.push(participant);
      }
    }

    unassigned = shuffle(nextRound);
  }

  const fallbackTeams = shuffle(Array.from(remainingTeams));

  unassigned.forEach((participant, index) => {
    pendingAssignments.set(participant.id, {
      team: fallbackTeams[index],
      rank: null,
    });
  });

  for (const participant of participants) {
    const assignment = pendingAssignments.get(participant.id);

    if (!assignment) {
      throw new Error(`Missing draw assignment for ${participant.full_name}.`);
    }

    await query(
      `update participants
      set assigned_team = $1,
          assignment_rank = $2,
          status = 'active',
          elimination_message = null
      where id = $3`,
      [assignment.team, assignment.rank, participant.id],
    );
  }

  return {
    summary: await getSweepstakeSummary(),
  };
}

export async function markTeamEliminated(teamName: string, eliminated: boolean) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured yet.");
  }

  const team = normalizeValue(teamName);

  if (!WORLD_CUP_TEAM_SET.has(team)) {
    throw new Error("Please choose a valid World Cup team.");
  }

  const participant = await queryOne<ParticipantRow>(
    `select
      id,
      full_name,
      email,
      department,
      phone,
      location,
      team_preferences,
      assigned_team,
      assignment_rank,
      payment_confirmed,
      status,
      elimination_message,
      created_at::text,
      updated_at::text
    from participants
    where assigned_team = $1`,
    [team],
  );

  if (!participant) {
    throw new Error("No participant has been assigned that team yet.");
  }

  await query(
    `update participants
    set status = $1,
        elimination_message = $2
    where id = $3`,
    [
      eliminated ? "eliminated" : "active",
      eliminated ? buildEliminationMessage(team) : null,
      participant.id,
    ],
  );

  return {
    summary: await getSweepstakeSummary(),
  };
}
