import { Skeleton } from "@/components/ui";

export default function SearchLoading() {
  return (
    <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-80" />
      ))}
    </div>
  );
}
