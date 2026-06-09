import { NextResponse } from "next/server";
import { assertAdminToken } from "@/lib/admin";
import { setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string };
    assertAdminToken(token ?? null);

    const response = NextResponse.json({
      message: "Admin session created.",
    });
    setAdminSession(response);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in.";
    const status =
      error instanceof Error && error.name === "UNAUTHORIZED" ? 401 : 400;

    return NextResponse.json({ message }, { status });
  }
}
