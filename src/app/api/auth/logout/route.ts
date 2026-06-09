import { NextResponse } from "next/server";
import { clearSessions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out." });
  clearSessions(response);
  return response;
}
