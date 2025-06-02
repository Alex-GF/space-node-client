export interface FallbackSubscription {
  /**
   * The name of the plan to which the user will be subscribed after novation.
   */
  subscriptionPlan: string;
  /**
   * The set of add-ons that to which the user will be subscribed after novation.
   */
  subscriptionAddOns: Record<string, number>;
}

export interface ContractToCreate {
  userContact: {
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  billingPeriod?: {
    autoRenew?: boolean;
    renewalDays?: number;
  };
  contractedServices: Record<string, string>; // service name → pricing path
  subscriptionPlans: Record<string, string>; // service name → plan name
  subscriptionAddOns: Record<string, Record<string, number>>; // service name → { addOn: count }
}

export type Subscription = Pick<ContractToCreate, 'contractedServices' | 'subscriptionPlans' | 'subscriptionAddOns'>

export interface Contract {
  userContact: UserContact;
  billingPeriod: {
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
    renewalDays: number;
  };
  usageLevels: Record<string, Record<string, UsageLevel>>;
  contractedServices: Record<string, string>;
  subscriptionPlans: Record<string, string>;
  subscriptionAddOns: Record<string, Record<string, number>>;
  history: ContractHistoryEntry[];
}

export interface UsageLevel {
  resetTimeStamp?: Date; // o Date si no es serializado
  consumed: number;
}

export interface ContractHistoryEntry {
  startDate: Date;
  endDate: Date;
  contractedServices: Record<string, string>;
  subscriptionPlans: Record<string, string>;
  subscriptionAddOns: Record<string, Record<string, number>>;
}

export interface UserContact {
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}