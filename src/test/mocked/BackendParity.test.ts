import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SpaceClient } from '../../main/index';
import { MockSpace } from './mockSpace';

const subscription = { contractedServices: { acme: '1' }, subscriptionPlans: { acme: 'pro' }, subscriptionAddOns: {} };
const contract = { userContact: { userId: 'a/b', username: 'alice' }, ...subscription };

describe('Backend parity and detailed refunds', () => {
  const space = new MockSpace();
  let client: SpaceClient;
  beforeAll(() => space.start());
  afterEach(async () => { await client.close(); space.reset(); vi.restoreAllMocks(); });
  afterAll(() => space.stop());
  function connect(retries = 0) {
    space.capabilities = ['idempotency-key', 'atomic-usage-limits'];
    space.route('GET', '/healthcheck', { status: 200, body: {} });
    client = new SpaceClient({ url: space.url, apiKey: 'key', retries, retryBaseDelayMs: 0 });
    return client;
  }
  it('novates groups using an encoded query, stable key on retry and cache invalidation', async () => {
    connect(1);
    const invalidation = vi.spyOn(client.getCache(), 'invalidateUser');
    let attempt = 0;
    space.route('PUT', '/contracts', () => ++attempt === 1 ? { status: 503 } : { status: 200, body: [contract] });
    const result = await client.contracts.updateContractSubscriptionByGroupId('team & ops', subscription, { idempotencyKey: 'group-op' });
    expect(result).toEqual([contract]);
    const writes = space.requests.filter(r => r.method === 'PUT');
    expect(writes).toHaveLength(2);
    expect(writes.every(r => r.query.get('groupId') === 'team & ops' && r.headers['idempotency-key'] === 'group-op')).toBe(true);
    expect(writes[0].body).toEqual(subscription);
    expect(invalidation).toHaveBeenCalledWith('a/b');
  });
  it('updates usage increments with an escaped user id and invalidates entitlements', async () => {
    connect();
    const invalidate = vi.spyOn(client.getCache(), 'invalidateUser');
    space.route('PUT', '/contracts/a%2Fb/usageLevels', { status: 200, body: contract });
    await client.contracts.updateContractUsageLevels('a/b', 'acme', { maxPets: 2 }, { idempotencyKey: 'usage-op' });
    expect(space.lastRequest().body).toEqual({ acme: { maxPets: 2 } });
    expect(space.lastRequest().headers['idempotency-key']).toBe('usage-op');
    expect(invalidate).toHaveBeenCalledWith('a/b');
  });
  it('deletes without retrying or sending an idempotency key', async () => {
    connect(2);
    const invalidate = vi.spyOn(client.getCache(), 'invalidateUser');
    space.route('DELETE', '/contracts/a%2Fb', { status: 204 });
    await client.contracts.removeContract('a/b');
    expect(space.lastRequest().headers['idempotency-key']).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith('a/b');
    space.route('DELETE', '/contracts/a%2Fb', { status: 503 });
    await expect(client.contracts.removeContract('a/b')).rejects.toMatchObject({ response: { status: 503 } });
    expect(space.requests.filter(r => r.method === 'DELETE')).toHaveLength(2);
  });
  it.each([204, 200, 404])('preserves a %s refund outcome', async status => {
    connect();
    const detail = { consumptionId: 'receipt', reverted: { 'acme-maxPets': 1 }, skipped: ['acme-missing'] };
    space.route('POST', '/features/u/acme-pets', { status, body: status === 200 ? detail : undefined });
    const result = await client.features.revertConsumptionDetails('u', 'acme-pets', 'receipt');
    expect(result).toEqual(status === 200 ? { ...detail, found: true } : { consumptionId: 'receipt', found: status !== 404, skipped: [] });
    expect(await client.features.revertConsumption('u', 'acme-pets', 'receipt')).toBe(status !== 404);
  });
  it('propagates a changed-state refusal without retrying', async () => {
    connect(2);
    space.route('POST', '/features/u/acme-pets', { status: 409, body: { code: 'IDEMPOTENCY_STATE_CHANGED' } });
    await expect(client.features.revertConsumptionDetails('u', 'acme-pets', 'receipt')).rejects.toMatchObject({ response: { status: 409, data: { code: 'IDEMPOTENCY_STATE_CHANGED' } } });
    expect(space.requests.filter(r => r.method === 'POST')).toHaveLength(1);
  });
});
