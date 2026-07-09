export function toToman(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

export function toJalaliDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
