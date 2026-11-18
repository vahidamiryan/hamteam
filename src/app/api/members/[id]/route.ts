import { errorResponse, ok, parseJson } from "@/lib/http";
import { workspaceService } from "@/lib/service";
import { memberUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const input = await parseJson(request, memberUpdateSchema);
    const { workspace, storage, result } = await workspaceService.updateMember(id, input);
    return ok({ data: workspace, storage, result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { workspace, storage, result } = await workspaceService.deleteMember(id);
    return ok({ data: workspace, storage, result });
  } catch (error) {
    return errorResponse(error);
  }
}
