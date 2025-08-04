// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A robust function to format a Kenyan phone number to the required 254XXXXXXXXX format for Paystack.
 * @param phoneNumber The phone number string to format.
 * @returns The formatted 12-digit phone number or an empty string if invalid.
 */
export const formatMpesaNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return "";
  }
  
  let cleanNumber = phoneNumber.replace(/\D/g, '');

  if (cleanNumber.startsWith('254') && cleanNumber.length === 12) return cleanNumber;
  if ((cleanNumber.startsWith('07') || cleanNumber.startsWith('01')) && cleanNumber.length === 10) return `254${cleanNumber.substring(1)}`;
  if ((cleanNumber.startsWith('7') || cleanNumber.startsWith('1')) && cleanNumber.length === 9) return `254${cleanNumber}`;
  if (cleanNumber.startsWith('2540')) return `254${cleanNumber.substring(4)}`;

  console.warn(`Could not format M-Pesa number: ${phoneNumber}. It did not match expected formats.`);
  return ""; // Return empty string for invalid formats
};
