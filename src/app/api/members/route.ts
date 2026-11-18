import { errorResponse, ok, parseJson } from "@/lib/http";
import { workspaceService } from "@/lib/service";
import { memberCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, memberCreateSchema);
    const { workspace, storage, result } = await workspaceService.createMember(input);
    return ok({ data: workspace, storage, result });
  } catch (error) {
    return errorResponse(error);
  }
}
