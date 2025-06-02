import { connect, SpaceClient } from '../../main';
import { addService } from './services/helpers';
import { TEST_API_KEY, TEST_SPACE_URL } from '../lib/axios';

export async function setUpTestEnvironment(): Promise<SpaceClient> {
  return await new Promise((resolve, reject) => {
    let spaceClient = connect({
      url: TEST_SPACE_URL,
      apiKey: TEST_API_KEY,
    });

    spaceClient.on('synchronized', async () => {
      console.log('SpaceClient is synchronized and ready for tests.');
      
      addService('./src/test/resources/pricings/TomatoMeter.yml')
        .then(() => {
          resolve(spaceClient);
        })
        .catch((error) => {
          resolve(spaceClient);
        });
    });

    spaceClient.on('error', error => {
      console.error('Error in SpaceClient:', error);
      reject(error);
    });
  });
}
