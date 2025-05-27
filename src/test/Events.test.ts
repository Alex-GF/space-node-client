import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connect, SpaceClient } from '../main/index';
import { TEST_API_KEY, TEST_SPACE_URL } from './utils/setup';
import { generatePricingFile } from './utils/pricings/generators';
import { v4 as uuidv4 } from 'uuid';

describe('Features Module Test Suite', () => {
  let client: SpaceClient;

  beforeAll(async () => {
    client = connect({
      url: TEST_SPACE_URL,
      apiKey: TEST_API_KEY,
    });
  });

  afterEach(async () => {
    if (client && (await client.isConnectedToSpace())) {
      client.removeAllListeners();
    }
  });

  afterAll(async () => {
    if (client && (await client.isConnectedToSpace())) {
      client.disconnect();
    }
  });

  it('Should evaluate feature with usage limit', async () => {
    const testServiceName = uuidv4();
    const testPricingVersion = '1.0.0';

    const response = await new Promise(async resolve => {
      client.on('pricing_created', data => {
        expect(data).toBeDefined();
        expect(data.serviceName).toBe(testServiceName);
        expect(data.pricingVersion).toBe(testPricingVersion);
        resolve(true);
      });

      setTimeout(() => {
        resolve(false);
      }, 5000);

      // Create a new pricing to trigger the event
      try {
        await client.services.addService(
          await generatePricingFile(testServiceName, testPricingVersion)
        );
      } catch (error) {
        console.error('Error adding service:', error);
        resolve(false);
      }
    });

    expect(response).toBeTruthy();

    client.removeListener('pricing_created');
  });

  it('Should evaluate feature with usage limit', async () => {
    const testServiceName = uuidv4();
    const testPricingVersionToArchive = '1.0.0';
    const testActivePricingVersion = '2.0.0';

    const response = await new Promise(async resolve => {
      client.on('pricing_archived', data => {
        expect(data).toBeDefined();
        expect(data.serviceName).toBe(testServiceName);
        expect(data.pricingVersion).toBe(testPricingVersionToArchive);
        resolve(true);
      });

      setTimeout(() => {
        resolve(false);
      }, 5000);

      // Create a new pricing to trigger the event
      try {
        await client.services.addService(
          await generatePricingFile(testServiceName, testPricingVersionToArchive)
        );
        await client.services.addPricing(
          testServiceName,
          await generatePricingFile(testServiceName, testActivePricingVersion)
        );
        const pricing = await client.services.getPricing(testServiceName, testActivePricingVersion);
        await client.services.changePricingAvailability(
          testServiceName,
          testPricingVersionToArchive,
          'archived',
          {
            subscriptionPlan: Object.keys(pricing.plans)[0],
            subscriptionAddOns: {},
          }
        );
      } catch (error) {
        console.error('Error adding service:', error);
        resolve(false);
      }
    });

    expect(response).toBeTruthy();
  });

  it('Should evaluate feature with usage limit', async () => {
    const testServiceName = uuidv4();
    const testPricingVersionToArchive = '1.0.0';
    const testActivePricingVersion = '2.0.0';

    const response = await new Promise(async resolve => {
      client.on('pricing_actived', data => {
        expect(data).toBeDefined();
        expect(data.serviceName).toBe(testServiceName);
        expect(data.pricingVersion).toBe(testPricingVersionToArchive);
        resolve(true);
      });

      // Create a new pricing to trigger the event
      try {
        await client.services.addService(
          await generatePricingFile(testServiceName, testPricingVersionToArchive)
        );
        await client.services.addPricing(
          testServiceName,
          await generatePricingFile(testServiceName, testActivePricingVersion)
        );
        const pricing = await client.services.getPricing(testServiceName, testActivePricingVersion);
        await client.services.changePricingAvailability(
          testServiceName,
          testPricingVersionToArchive,
          'archived',
          {
            subscriptionPlan: Object.keys(pricing.plans)[0],
            subscriptionAddOns: {},
          }
        );
        await client.services.changePricingAvailability(
          testServiceName,
          testPricingVersionToArchive,
          'active'
        );

        setTimeout(() => {
          resolve(false);
        }, 5000);
      } catch (error) {
        console.error('Error adding service:', error);
        resolve(false);
      }
    });

    expect(response).toBeTruthy();
  });
});
