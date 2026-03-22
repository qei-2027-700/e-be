import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "default" | "lg";

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

const base =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all select-none";

const variants: Record<Variant, string> = {
  default: "bg-brand text-brand-foreground hover:bg-brand/80",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  ghost: "hover:bg-muted hover:text-foreground",
};

const sizes: Record<Size, string> = {
  sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
  default: "h-8 gap-1.5 px-2.5",
  lg: "h-9 gap-1.5 px-3",
};

export function LinkButton({
  href,
  variant = "default",
  size = "default",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
