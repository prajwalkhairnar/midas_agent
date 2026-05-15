import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function findCharOffset(haystack: string, needle: string, fallback = 0): number {
  if (!needle) return fallback
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase())
  return idx >= 0 ? idx : fallback
}
