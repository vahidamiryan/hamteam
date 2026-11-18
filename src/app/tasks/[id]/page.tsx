import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * آدرس اختصاصی تسک: `/tasks/<id>`
 * همان پوستهٔ برد را نشان می‌دهد و پنل همان تسک باز است، پس لینک برای هر عضو
 * تیم دقیقاً همان چیزی را باز می‌کند که فرستاده شده است.
 *
 * `params` یک Promise است و در Next 16 با `cacheComponents` باید داخل
 * `<Suspense>` خوانده شود تا پوستهٔ صفحه از پیش ساخته شود.
 */
export default function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  return (
    <Suspense fallback={<TaskRouteFallback />}>
      <TaskRoute params={params} />
    </Suspense>
  );
}

async function TaskRoute({ params }: Pick<PageProps<"/tasks/[id]">, "params">) {
  const { id } = await params;
  return <AppShell initialTaskId={id} />;
}

function TaskRouteFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
