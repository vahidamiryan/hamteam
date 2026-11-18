import { errorResponse, ok } from "@/lib/http";
import { workspaceService } from "@/lib/service";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { workspace, storage, result } = await workspaceService.deleteComment(id);
    return ok({ data: workspace, storage, result });
  } catch (error) {
    return errorResponse(error);
  }
}
