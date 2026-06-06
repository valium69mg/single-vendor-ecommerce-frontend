import { cn } from "@/lib/utils";

export default function ProductStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-store-body font-medium border rounded-none",
        status === "ACTIVE" && "border-green-300 bg-green-50 text-green-700",
        status === "INACTIVE" && "border-red-300 bg-red-50 text-red-700",
        status === "DRAFT" && "border-stone-300 bg-stone-50 text-stone-500",
        !["ACTIVE", "INACTIVE", "DRAFT"].includes(status) &&
          "border-stone-300 bg-stone-50 text-stone-500",
      )}
    >
      {status}
    </span>
  );
}
