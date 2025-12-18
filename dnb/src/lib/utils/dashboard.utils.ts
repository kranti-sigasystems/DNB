/**
 * Dashboard Utility Functions
 * Pure functions for data transformation and calculations
 */

import { USER_ROLES } from '@/lib/constants/dashboard';
import type { UserRole } from '@/lib/constants/dashboard';

/**
 * Get user-friendly label for different user roles
 */
export function getUserRoleLabel(role: string, plural = false): string {
  const labels: Record<string, { singular: string; plural: string }> = {
    [USER_ROLES.SUPER_ADMIN]: { singular: 'Business Owner', plural: 'Business Owners' },
    [USER_ROLES.BUSINESS_OWNER]: { singular: 'Buyer', plural: 'Buyers' },
    [USER_ROLES.BUYER]: { singular: 'User', plural: 'Users' },
  };

  const label = labels[role] || { singular: 'User', plural: 'Users' };
  return plural ? label.plural : label.singular;
}

/**
 * Calculate pagination range
 */
export function calculatePaginationRange(
  currentPage: number,
  pageSize: number,
  totalItems: number
): { start: number; end: number } {
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);
  return { start, end };
}

/**
 * Generate smart page numbers for pagination
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages - 1, start + maxVisible - 1);
  const adjustedStart = Math.max(0, end - maxVisible + 1);

  return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
}

/**
 * Check if search filters are active
 */
export function hasActiveFilters(filters: Record<string, any>): boolean {
  return Object.values(filters).some((value) => {
    if (value === undefined || value === null || value === '') return false;
    return true;
  });
}

/**
 * Format user name from first and last name
 */
export function formatUserName(firstName?: string, lastName?: string, fallback?: string): string {
  const name = `${firstName || ''} ${lastName || ''}`.trim();
  
  // If no name provided, return fallback or a more user-friendly default
  if (!name) {
    return fallback || 'Unknown User';
  }
  
  return name;
}

/**
 * Get status color class
 */
export function getStatusColorClass(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    inactive: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    deleted: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return colors[status.toLowerCase()] || colors.pending;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) return '+0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Format large numbers with K, M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}