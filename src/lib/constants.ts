export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

export const ADMIN_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in ms

export const ASSET_STATUS = {
  PENDING: "pending",
  IMPLEMENTED: "implemented",
} as const;

export type AssetStatus = (typeof ASSET_STATUS)[keyof typeof ASSET_STATUS];
