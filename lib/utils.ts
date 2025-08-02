// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A robust function to format a Kenyan phone number to the required 254XXXXXXXXX format for Paystack.
 * @param phoneNumber The phone number string to format.
 * @returns The formatted phone number or an empty string if invalid.
 */
export const formatMpesaNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return "";
  }
  
  // 1. Remove all non-digit characters
  let cleanNumber = phoneNumber.replace(/\D/g, '');

  // 2. Handle various Kenyan formats
  if (cleanNumber.startsWith('07') || cleanNumber.startsWith('01')) {
      // Format 07... or 01...
      cleanNumber = `254${cleanNumber.substring(1)}`;
  } else if (cleanNumber.startsWith('7') || cleanNumber.startsWith('1')) {
      // Format 7... or 1...
      cleanNumber = `254${cleanNumber}`;
  } else if (cleanNumber.startsWith('+254')) {
      // Format +254...
      cleanNumber = cleanNumber.substring(1);
  }

  // 3. Final validation: must be 12 digits and start with 254
  if (cleanNumber.length === 12 && cleanNumber.startsWith('254')) {
    return cleanNumber;
  }

  console.warn(`Could not format M-Pesa number: ${phoneNumber} -> ${cleanNumber}`);
  return ""; // Return empty string if it's not a valid format
};
