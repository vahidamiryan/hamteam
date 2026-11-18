import { errorResponse, ok, parseJson } from "@/lib/http";
import { workspaceService } from "@/lib/service";
import { taskCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, taskCreateSchema);
    const { workspace, storage, result } = await workspaceService.createTask(input);
    return ok({ data: workspace, storage, result });
  } catch (error) {
    return errorResponse(error);
  }
}
