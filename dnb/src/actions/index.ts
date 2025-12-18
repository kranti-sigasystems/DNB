// Export all server actions for easy importing

// Authentication actions
export * from './auth.actions';

// Dashboard actions (unified)
export * from './dashboard.actions';

// Super Admin specific actions
export * from './superadmin.actions';

// Business Owner specific actions
export * from './business-owner.actions';

// Buyer specific actions
export * from './buyer.actions';

// Re-export commonly used actions with aliases for convenience
export { 
  getAllBusinessOwners as getSuperAdminData,
  searchBusinessOwners as searchSuperAdminData,
  activateBusinessOwner,
  deactivateBusinessOwner,
  deleteBusinessOwner 
} from './superadmin.actions';

export { 
  getAllBuyers as getBusinessOwnerData,
  searchBuyers as searchBusinessOwnerData,
  activateBuyer,
  deactivateBuyer,
  deleteBuyer,
  createBuyer 
} from './business-owner.actions';

export { 
  getBuyerProfile,
  updateBuyerProfile,
  getBuyerDashboard,
  getBuyerOffers,
  createOffer,
  updateOffer,
  deleteOffer 
} from './buyer.actions';