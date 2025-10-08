import { clsx, type ClassValue } from "clsx";

export function cx(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function safeParseInt(value: string | number | undefined | null) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}
