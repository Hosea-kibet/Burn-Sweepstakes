import { NextResponse } from "next/server";
import { createSignup, getSweepstakeSummary } from "@/lib/sweepstakes";

export async function GET() {
  const summary = await getSweepstakeSummary();
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createSignup(body);

    return NextResponse.json(
      {
        message:
          "You’re on the sheet. Payment instructions and group confirmation will follow from the organiser.",
        ...result,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while saving the signup.";

    const status =
      error instanceof Error &&
      (error.name === "DUPLICATE_ENTRY" || error.name === "SWEEPSTAKE_FULL")
        ? 409
        : 400;

    return NextResponse.json({ message }, { status });
  }
}
