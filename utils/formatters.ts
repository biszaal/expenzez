/**
 * Utility functions for formatting data consistently across the app
 */

import { getActiveCurrency } from "./currencyStore";
import { localeForCurrency, symbolForCurrency } from "../constants/currencies";

/**
 * Format a monetary amount using the user's active display currency.
 *
 * This formats only — it never converts. When `currency` is omitted it uses
 * the active display currency from `currencyStore` (set by CurrencyContext),
 * and the matching locale so each currency renders conventionally
 * (e.g. "$1,234.56", "1.234,56 €", "¥1,235"). Decimal places follow the
 * currency's own convention (2 for GBP/USD/EUR, 0 for JPY, etc.).
 *
 * @param amount - Amount to format
 * @param currency - ISO 4217 code (default: active display currency)
 * @param locale - Locale for formatting (default: derived from currency)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = getActiveCurrency(),
  locale: string = localeForCurrency(currency),
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      ...(options || {}),
    }).format(safeAmount);
  } catch {
    // Fallback if the runtime/locale/currency isn't supported by Intl.
    const digits = options?.maximumFractionDigits ?? 2;
    return `${symbolForCurrency(currency)}${safeAmount.toFixed(digits)}`;
  }
}

/**
 * Format percentage with proper decimal places
 *
 * @param value - Percentage value (0-100)
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimalPlaces = 1): string {
  return `${value.toFixed(decimalPlaces)}%`;
}

/**
 * Format date to readable string
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", options).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "1 day ago")
 *
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  return formatDate(dateObj);
}

/**
 * Format phone number with proper spacing
 *
 * @param phoneNumber - Raw phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Format UK phone numbers
  if (cleaned.startsWith("44")) {
    const number = cleaned.substring(2);
    if (number.length === 10) {
      return `+44 ${number.substring(0, 4)} ${number.substring(4, 7)} ${number.substring(7)}`;
    }
  }

  // Format other numbers
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `+44 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }

  return phoneNumber;
}

/**
 * Truncate text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitalize first letter of each word
 *
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
