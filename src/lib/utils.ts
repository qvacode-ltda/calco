import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conditional logic, de-duplicating conflicting
 * utilities (e.g. `px-2 px-4` → `px-4`). Use in `.astro` and any island components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
