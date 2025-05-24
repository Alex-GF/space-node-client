export interface SpaceConnectionOptions {
  /**
   * The URL of the Space server to connect to.
   */
  url: string;

  /**
   * The API key for authentication.
   */
  apiKey: string;

  /**
   * Optional timeout for the connection in milliseconds.
   */
  timeout?: number;
}

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
