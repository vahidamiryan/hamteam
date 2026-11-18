import { errorResponse, ok } from "@/lib/http";
import { workspaceService } from "@/lib/service";

export async function POST() {
  try {
    const { workspace, storage } = await workspaceService.reset();
    return ok({ data: workspace, storage });
  } catch (error) {
    return errorResponse(error);
  }
}
