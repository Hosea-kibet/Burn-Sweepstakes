import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { markTeamEliminated } from "@/lib/sweepstakes";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ message: "Admin login required." }, { status: 401 });
    }

    const { teamName, eliminated } = (await request.json()) as {
      teamName?: string;
      eliminated?: boolean;
    };

    const result = await markTeamEliminated(teamName ?? "", Boolean(eliminated));

    return NextResponse.json(
      {
        message: eliminated
          ? `${teamName} have been marked as knocked out. The banter is live.`
          : `${teamName} have been restored to active status.`,
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update team status.";
    const status =
      error instanceof Error && error.name === "UNAUTHORIZED" ? 401 : 400;

    return NextResponse.json({ message }, { status });
  }
}
