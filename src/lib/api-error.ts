import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@market/contracts";

export function apiError(status: number, code: string, message: string) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      requestId: crypto.randomUUID(),
    },
  };
  return NextResponse.json(body, { status });
}
