import { errorResponse, ok, parseJson } from "@/lib/http";
import { workspaceService } from "@/lib/service";
import { goalCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, goalCreateSchema);
    const { workspace, storage, result } = await workspaceService.createGoal(input);
    return ok({ data: workspace, storage, result });
  } catch (error) {
    return errorResponse(error);
  }
}
