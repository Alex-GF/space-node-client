import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SpaceClient } from '../main/index';
import { setUpTestEnvironment } from './utils/setup';
import { v4 as uuidv4 } from 'uuid';

describe('Contracts Module Test Suite', () => {
  let client: SpaceClient;
  let testUserId: string;

  beforeAll(async () => {
    client = await setUpTestEnvironment();
    testUserId = uuidv4(); // Generate a unique user ID for testing
  });

  afterAll(async () => {
    if (client && await client.isConnectedToSpace()) {
      client.disconnect();
    }
  })

  it('Should add contract to SPACE', async () => {
    const contractToCreate = {
      userContact: {
        userId: testUserId,
        username: `testUser-${testUserId}`,
      },
      billingPeriod: {
        autoRenew: true,
        renewalDays: 30,
      },
      contractedServices: {
        tomatoMeter: '1.0.0',
      },
      subscriptionPlans: {
        tomatoMeter: 'ADVANCED',
      },
      subscriptionAddOns: {
        tomatoMeter: {
          'extraTimers': 2,
        },
      },
    }

    const response = await client.contracts.addContract(contractToCreate);

    expect(response).toBeDefined();
    expect(response.userContact.userId).toBe(testUserId);
  });

  it('Should modify contract from SPACE', async () => {
    const newSubscription = {
      contractedServices: {
        tomatoMeter: '1.0.0',
      },
      subscriptionPlans: {
        tomatoMeter: 'PREMIUM',
      },
      subscriptionAddOns: {
        tomatoMeter: {
          'extraTimers': 2,
          'exportAsJson': 1,
        },
      },
    }

    const response = await client.contracts.updateContractSubscription(testUserId, newSubscription);

    expect(response).toBeDefined();
    expect(response.userContact.userId).toBe(testUserId);
    expect(Object.values(response.contractedServices)[0]).toBe('1.0.0');
    expect(response.subscriptionPlans.tomatoMeter).toBe('PREMIUM');
    expect(response.subscriptionAddOns.tomatoMeter['exportAsJson']).toBe(1);
  });
});
