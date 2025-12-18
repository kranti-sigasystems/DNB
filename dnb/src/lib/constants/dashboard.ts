/**
 * Dashboard Constants
 * Centralized configuration for dashboard components
 */

export const DASHBOARD_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
    MAX_VISIBLE_PAGES: 5,
  },
  ANIMATION: {
    TRANSITION_DURATION: 300,
    SKELETON_ROWS: 8,
    MOBILE_SKELETON_CARDS: 5,
  },
  TABLE: {
    COLUMNS_COUNT: 6,
    MOBILE_BREAKPOINT: 'lg',
  },
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  BUSINESS_OWNER: 'business_owner',
  BUYER: 'buyer',
  GUEST: 'guest',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  DELETED: 'deleted',
} as const;

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
  NONE: null,
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type SortDirection = typeof SORT_DIRECTIONS[keyof typeof SORT_DIRECTIONS];