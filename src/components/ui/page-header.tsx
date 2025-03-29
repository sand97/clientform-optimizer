
import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  heading,
  text,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="grid gap-1">
          <h1 className="font-heading text-xl font-bold">{heading}</h1>
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
