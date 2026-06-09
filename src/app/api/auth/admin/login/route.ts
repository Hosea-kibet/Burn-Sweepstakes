import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/sweepstakes";

export async function POST(request: Request) {
  try {
    const { email, pin } = (await request.json()) as {
      email?: string;
      pin?: string;
    };
    const admin = await authenticateAdmin(email ?? "", pin ?? "");

    const response = NextResponse.json({
      message: `Welcome back, ${admin.fullName}.`,
    });
    setAdminSession(response, admin.email);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in.";
    const status =
      error instanceof Error && error.name === "UNAUTHORIZED" ? 401 : 400;

    return NextResponse.json({ message }, { status });
  }
}
