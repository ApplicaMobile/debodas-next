import { ListSkeleton } from "@/components/ui/Skeleton";

export default function RegalosRecibidosLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-52 animate-pulse rounded bg-stone-200" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-stone-200" />
      </div>
      <ListSkeleton rows={4} />
    </div>
  );
}
