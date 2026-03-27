export interface Zone {
  id: string;
  name: string;
}

export interface Building {
  id: string;
  name: string;
  zones: Zone[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CampusData {
  buildings: Building[];
  categories: Category[];
}

export interface ItemFinder {
  id: string;
  clerkId: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ClaimUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Claim {
  id: string;
  itemId: string;
  loserId: string;
  verificationAttempt: string;
  status: "pending" | "approved" | "rejected";
  finderConfirmedAt: string | null;
  claimerConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  loser: ClaimUser;
  review?: {
    confidenceScore: number;
    confidenceLevel: "low" | "medium" | "high";
    matchedSignals: number;
  };
}

export interface Item {
  id: string;
  finderId: string;
  category: string;
  description: string;
  photoCloudinaryId: string;
  photoBlurRegions: Array<{ x: number; y: number; width: number; height: number }> | null;
  locationZone: string;
  postedAt: string;
  expiresAt: string;
  status: "active" | "claimed" | "returned" | "expired";
  finder: ItemFinder;
  _count?: { claims: number };
}

export interface ClaimMessage {
  id: string;
  claimId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ClaimUser;
}

export interface Notification {
  id: string;
  type: string;
  relatedItemId: string | null;
  content: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchResult {
  items: Item[];
  pagination: Pagination;
}

export interface CreateItemPayload {
  category: string;
  description: string;
  secretMarkers: string[];
  photoCloudinaryId: string;
  photoBlurRegions?: Array<{ x: number; y: number; width: number; height: number }> | null;
  locationZone: string;
}

export interface ClaimedItemEntry {
  id: string;
  itemId: string;
  loserId: string;
  status: "pending" | "approved" | "rejected";
  finderConfirmedAt: string | null;
  claimerConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  item: Item;
}

export interface FinderHandoffClaimSummary {
  id: string;
  finderConfirmedAt: string | null;
  claimerConfirmedAt: string | null;
  updatedAt: string;
  loser: ClaimUser;
}

export interface FinderHandoffItem extends Item {
  claims: FinderHandoffClaimSummary[];
}

export interface PublicAnalytics {
  totals: {
    totalItems: number;
    activeItems: number;
    claimedItems: number;
    returnedItems: number;
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    handoffCompletionRate: number;
    claimApprovalRate: number;
  };
  topCategories: Array<{ value: string; count: number }>;
  topLocations: Array<{ value: string; count: number }>;
}
