import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/** خطایی که مستقیماً به کاربر نشان داده می‌شود (۴xx). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function ok(data: unknown): NextResponse {
  return NextResponse.json(data, {
    headers: { "cache-control": "no-store" },
  });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[api] unexpected error", error);
  return NextResponse.json(
    { error: "خطای غیرمنتظره در سرور رخ داد. کمی بعد دوباره تلاش کنید." },
    { status: 500 },
  );
}

export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "بدنه‌ی درخواست JSON معتبر نیست.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ApiError(400, first?.message ?? "داده‌ی ارسالی معتبر نیست.");
  }
  return parsed.data;
}
