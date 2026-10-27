"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-48 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 p-1 text-zinc-100 shadow-lg shadow-black/40",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, active, children, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-2 text-sm outline-none transition-colors hover:bg-zinc-800 focus:bg-zinc-800",
        className
      )}
      {...props}
    >
      {children}
      {active ? <Check className="size-4 text-zinc-300" /> : null}
    </DropdownMenuPrimitive.Item>
  );
}
