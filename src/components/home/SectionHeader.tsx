import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="font-store-heading text-4xl font-semibold text-stone-900 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-stone-500 font-store-body">
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors font-store-body shrink-0 ml-8"
        >
          {actionLabel}
          <ArrowRight size={ICON.sm} aria-hidden />
        </Link>
      )}
    </div>
  );
}
