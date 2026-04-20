export type CloudPlan = 'FREE' | 'PRO';

export type PlanLimits = {
  admins: number;
  tables: number;
  registers: number;
  cashiers: number;
  cooks: number;
  waiters: number;
};

export type PlanCapabilities = {
  cloudSyncEnabled: boolean;
  displayName: string;
  limits: PlanLimits;
};

const UNLIMITED_LIMITS: PlanLimits = {
  admins: -1,
  tables: -1,
  registers: -1,
  cashiers: -1,
  cooks: -1,
  waiters: -1,
};

export const PLAN_CAPABILITIES: Record<CloudPlan, PlanCapabilities> = {
  FREE: {
    cloudSyncEnabled: false,
    displayName: 'Plan FREE',
    limits: UNLIMITED_LIMITS,
  },
  PRO: {
    cloudSyncEnabled: true,
    displayName: 'Plan PRO',
    limits: UNLIMITED_LIMITS,
  },
};

export function normalizeCloudPlan(plan?: string | null): CloudPlan {
  if (!plan) {
    return 'FREE';
  }

  const upper = String(plan).toUpperCase();

  const normalized = upper as CloudPlan;
  return PLAN_CAPABILITIES[normalized] ? normalized : 'FREE';
}

export function getPlanCapabilities(plan?: string | null): PlanCapabilities {
  const normalized = normalizeCloudPlan(plan);
  return PLAN_CAPABILITIES[normalized];
}

export function canUseCloudSync(plan?: string | null): boolean {
  return getPlanCapabilities(plan).cloudSyncEnabled;
}
