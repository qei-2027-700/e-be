"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavBarProps {
  locale: string;
  isLoggedIn: boolean;
  labels: {
    signIn: string;
    signUp: string;
    dashboard: string;
  };
}

const btnBase =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all select-none h-7 gap-1 px-2.5 text-[0.8rem]";

export function NavBar({ locale, isLoggedIn, labels }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        scrolled && "border-b bg-background/95 shadow-sm backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 h-16">
        <Link href={`/${locale}`} className="text-lg font-bold tracking-tight">
          E-be
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href={`/${locale}/dashboard`}
              className={cn(btnBase, "bg-primary text-primary-foreground hover:bg-primary/80")}
            >
              {labels.dashboard}
            </Link>
          ) : (
            <>
              <Link
                href={`/${locale}/auth/sign-in`}
                className={cn(btnBase, "hover:bg-muted hover:text-foreground")}
              >
                {labels.signIn}
              </Link>
              <Link
                href={`/${locale}/auth/sign-up`}
                className={cn(btnBase, "bg-primary text-primary-foreground hover:bg-primary/80")}
              >
                {labels.signUp}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
