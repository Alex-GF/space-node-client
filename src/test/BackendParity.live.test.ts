import { describe, it, expect } from 'vitest';
import { SpaceClient, pricingTokenUserId } from '../main/index';
import { TEST_API_KEY, TEST_SPACE_URL } from './lib/axios';
import { addService } from './utils/services/helpers';

// Run only against an explicitly configured disposable SPACE; mocked CI never creates real data.
describe.skipIf(!process.env.SPACE_TEST_URL)('Backend parity against real SPACE', () => {
  it('supports groups, conditional changes, usage, token verification and deletion end to end', async () => {
    const client = new SpaceClient({ url: TEST_SPACE_URL, apiKey: TEST_API_KEY, retries: 1 });
    const suffix = `${Date.now()}`;
    const users = [`sdk/${suffix}/one`, `sdk/${suffix}/two`];
    const groupId = `sdk-group-${suffix}`;
    const subscription = { contractedServices: { tomatometer: '1.0.0' }, subscriptionPlans: { tomatometer: 'ADVANCED' }, subscriptionAddOns: {} };
    try {
      try { await addService('./src/test/resources/pricings/TomatoMeter.yml'); } catch { /* Already present in the test organization. */ }
      for (const userId of users) {
        await client.contracts.addContract({ userContact: { userId, username: userId }, groupId, ...subscription });
      }
      const pricings = await client.contracts.getPricings(users[0]);
      expect(pricings.contractVersion).toBeTruthy();
      const yaml = await client.pricings.getYaml('tomatometer', '1.0.0');
      expect(yaml.yaml).toContain('TomatoMeter');
      expect((await client.pricings.getYaml('tomatometer', '1.0.0', { etag: yaml.etag! })).notModified).toBe(true);
      const preview = await client.contracts.previewNovation(users[0], subscription, { keepBillingPeriod: true });
      expect(preview.valid).toBe(true);
      await client.contracts.updateContractSubscription(users[0], subscription, { expectedContractVersion: preview.contractVersion, keepBillingPeriod: true });
      const grouped = await client.contracts.updateContractSubscriptionByGroupId(groupId, subscription, { idempotencyKey: `${suffix}:group` });
      expect(grouped.map(c => c.userContact.userId).sort()).toEqual(users.slice().sort());
      const updated = await client.contracts.updateContractUsageLevels(users[0], 'tomatometer', { maxPomodoroTimers: 1 }, { idempotencyKey: `${suffix}:usage` });
      const replay = await client.contracts.updateContractUsageLevels(users[0], 'tomatometer', { maxPomodoroTimers: 1 }, { idempotencyKey: `${suffix}:usage` });
      expect(replay.usageLevels).toEqual(updated.usageLevels);
      const evaluation = await client.features.evaluate(users[0], 'tomatometer-pomodoroTimer', { 'tomatometer-maxPomodoroTimers': 1 });
      expect(evaluation.consumptionId).toBeTruthy();
      const refund = await client.features.revertConsumptionDetails(users[0], 'tomatometer-pomodoroTimer', evaluation.consumptionId!);
      expect(refund.found).toBe(true);
      expect(refund.skipped).toEqual([]);
      const token = await client.features.generateUserPricingToken(users[0]);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      const verified = await client.features.verifyPricingToken(token, { organizationId: payload.organizationId });
      expect(pricingTokenUserId(verified)).toBe(users[0]);
      for (const user of users) await client.contracts.removeContract(user);
      await expect(client.contracts.getContract(users[0])).rejects.toMatchObject({ response: { status: 404 } });
    } finally {
      await client.close();
    }
  }, 20000);
});
