import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connect, SpaceClient } from '../main/index';

const SPACE_URL = 'http://localhost:5403';
const API_KEY = 'invalid-api-key';

describe('SpaceClient Connection Test Suite', () => {
  let client: SpaceClient;

  beforeAll(() => {
    client = connect({
      url: SPACE_URL,
      apiKey: API_KEY,
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
    await new Promise((resolve, reject) => {
      // @ts-ignore
      client.on('synchronized', () => {
        resolve(true);
      });
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  });
});
