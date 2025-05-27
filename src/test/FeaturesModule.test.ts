import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SpaceClient } from '../main/index';
import { setUpTestEnvironment } from './utils/setup';
import { v4 as uuidv4 } from 'uuid';
import { Contract } from '../main/types';

describe('Features Module Test Suite', () => {
  let client: SpaceClient;
  let testContract: Contract;

  beforeAll(async () => {
    client = await setUpTestEnvironment();
    testContract = await client.contracts.addContract({
      userContact: {
        userId: uuidv4(),
        username: `testUser-${uuidv4()}`,
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
    })
  });

  afterAll(async () => {
    if (client && await client.isConnectedToSpace()) {
      client.disconnect();
    }
  })

  it('Should evaluate feature with usage limit', async () => {
    const testFeatureId = "tomatometer-pomodoroTimer"

    const response = await client.features.evaluate(testContract.userContact.userId, testFeatureId);

    expect(response).toBeDefined();
    expect(response.eval).toBeTruthy();
  });

  it('Should evaluate feature with defaultValue = true', async () => {
    const testFeatureId = "tomatometer-soundNotifications"

    const response = await client.features.evaluate(testContract.userContact.userId, testFeatureId);

    expect(response).toBeDefined();
    expect(response.eval).toBeTruthy();
  });

  it('Should evaluate feature with defaultValue = false, but value = true', async () => {
    const testFeatureId = "tomatometer-dailySummary"

    const response = await client.features.evaluate(testContract.userContact.userId, testFeatureId);

    expect(response).toBeDefined();
    expect(response.eval).toBeTruthy();
  });

  it('Should evaluate feature and update usage level', async () => {
    const testFeatureId = "tomatometer-pomodoroTimer"
    const expectedConsumption = { 'tomatometer-maxPomodoroTimers': 1 };

    const response = await client.features.evaluate(testContract.userContact.userId, testFeatureId, expectedConsumption);

    expect(response).toBeDefined();
    expect(response.eval).toBeTruthy();
    expect(response.used).toBeDefined();
    expect(response.used!['tomatometer-maxPomodoroTimers']).toBe(1);
  });

  it('Should create pricingToken', async () => {
    const token = await client.features.generateUserPricingToken(testContract.userContact.userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    const parts = token.split('.');
    expect(parts.length).toBe(3);

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    expect(header).toBeDefined();
    expect(payload).toBeDefined();
    expect(header.alg).toBe('HS256'); // or the expected algorithm
    expect(payload.sub).toBe(testContract.userContact.userId);
  });
});
