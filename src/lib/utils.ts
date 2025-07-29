// Utility functions for the application

/**
 * Format a number as Euro currency
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the € symbol (default: true)
 * @returns Formatted Euro string
 */
export function formatEuro(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  
  if (!showSymbol) {
    return formatted.replace('€', '').trim()
  }
  
  return formatted
}

/**
 * Format a number as Euro currency without symbol
 * @param amount - The amount to format
 * @returns Formatted number string without €
 */
export function formatEuroAmount(amount: number): string {
  return formatEuro(amount, false)
}

/**
 * Parse a Euro string back to number
 * @param euroString - String like "€123.45" or "123.45"
 * @returns Parsed number
 */
export function parseEuro(euroString: string): number {
  const cleaned = euroString.replace(/[€,\s]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Calculate percentage of total
 * @param amount - The amount
 * @param total - The total amount
 * @returns Percentage as number
 */
export function calculatePercentage(amount: number, total: number): number {
  if (total === 0) return 0
  return (amount / total) * 100
}

/**
 * Format business/order number with padding
 * @param number - The number to format
 * @param prefix - Prefix like "PO"
 * @param padding - Number of digits to pad to
 * @returns Formatted string like "PO000123"
 */
export function formatOrderNumber(number: number, prefix: string = 'PO', padding: number = 6): string {
  return `${prefix}${String(number).padStart(padding, '0')}`
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Combine CSS classes conditionally
 * @param classes - Array of class strings or conditional objects
 * @returns Combined class string
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
} 