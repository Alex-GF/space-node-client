import { connect, SpaceClient } from '../../main';

export const TEST_SPACE_URL = 'http://localhost:3000';
export const TEST_API_KEY = '9cedd24632167a021667df44a26362dfb778c1566c3d4564e132cb58770d8c67';

export async function setUpTestEnvironment(): Promise<SpaceClient> {
  return await new Promise((resolve, reject) => {
    let spaceClient = connect({
      url: TEST_SPACE_URL,
      apiKey: TEST_API_KEY,
    });

    spaceClient.on('synchronized', () => {
      console.log('SpaceClient is synchronized and ready for tests.');
      // The service creation must be failing, since I get a 400 error during contract creation"
      spaceClient.services
        .addService('./src/test/resources/pricings/TomatoMeter.yml')
        .then((response) => {
          console.log('Service added successfully.');
          resolve(spaceClient);
        })
        .catch(_ => {
          console.error('The service is already created in space');
          resolve(spaceClient);
        });
    });

    spaceClient.on('error', error => {
      console.error('Error in SpaceClient:', error);
      reject(error);
    });
  });
}
