import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { connect, SpaceClient } from '../main/index';
import { TEST_API_KEY, TEST_SPACE_URL } from './lib/axios';

describe('SpaceClient Connection Test Suite', () => {
  let client: SpaceClient;

  beforeAll(() => {
    client = connect({
      url: TEST_SPACE_URL,
      apiKey: TEST_API_KEY,
    })
  });

  beforeEach(() => {
    client.connect();
  })

  afterEach(async () => {
    if (client && await client.isConnectedToSpace()) {
      client.disconnect();
    }
  })

  it('Should create a SpaceClient instance correctly', () => {
    expect(client).toBeDefined();
  });

  it('Should connect to the SpaceClient instance', async () => {
    const response = await new Promise((resolve, reject) => {
      // @ts-ignore
      client.on('synchronized', () => {
        resolve(true);
      });
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    expect(response).toBeTruthy();
  });
});
