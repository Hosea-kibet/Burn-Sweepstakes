import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { runDraw } from "@/lib/sweepstakes";

export async function POST() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ message: "Admin login required." }, { status: 401 });
    }

    const result = await runDraw();

    return NextResponse.json(
      {
        message: "Draw completed. Every participant now has a World Cup team.",
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to complete the draw.";
    const status =
      error instanceof Error && error.name === "UNAUTHORIZED" ? 401 : 400;

    return NextResponse.json({ message }, { status });
  }
}
