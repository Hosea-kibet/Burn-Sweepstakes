import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { setAccountAdminStatus } from "@/lib/sweepstakes";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ message: "Admin login required." }, { status: 401 });
    }

    const { accountId, isAdmin } = (await request.json()) as {
      accountId?: string;
      isAdmin?: boolean;
    };

    if (!accountId) {
      return NextResponse.json({ message: "Account ID is required." }, { status: 400 });
    }

    const result = await setAccountAdminStatus(accountId, Boolean(isAdmin));

    return NextResponse.json(
      {
        message: isAdmin
          ? "That account is now an admin and has been removed from the participant pool."
          : "That account is now a participant account again.",
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update account access.";
    const status =
      error instanceof Error && error.name === "UNAUTHORIZED" ? 401 : 400;

    return NextResponse.json({ message }, { status });
  }
}
