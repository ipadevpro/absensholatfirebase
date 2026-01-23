import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PrayerType, Gender } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export function getPrayersForDay(gender: Gender, date: Date): PrayerType[] {
  const day = date.getDay();
  const isFriday = day === 5;

  if (gender === "ikhwan") {
    if (isFriday) return ["jumat", "ashar"];
    return ["zuhur", "ashar"];
  }
  return ["zuhur", "ashar"];
}