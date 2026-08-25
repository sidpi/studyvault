"use client";

import { cn } from "@/lib/utils";

export interface CardProps {
  className?: string;
  children?: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className || "")}>
      {children}
    </div>
  );
}