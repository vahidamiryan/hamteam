import { connection } from "next/server";

import { errorResponse, ok } from "@/lib/http";
import { readWorkspace } from "@/lib/storage";

// با Cache Components، این فراخوانی تضمین می‌کند پاسخ در زمان درخواست ساخته شود.
export async function GET() {
  await connection();
  try {
    const { workspace, storage } = await readWorkspace();
    return ok({ data: workspace, storage });
  } catch (error) {
    return errorResponse(error);
  }
}
