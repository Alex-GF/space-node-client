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

export type SpaceEvent = "PRICING_CREATED" | "PRICING_ARCHIVED" | "PRICING_ACTIVED" | "SERVICE_DISABLED";

export * from './types/contracts';
export * from './types/features';