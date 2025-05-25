import axios from 'axios';
import { SpaceClient } from '../config/SpaceClient';

export class FeatureModule {
  private spaceClient: SpaceClient;

  /**
   * Creates an instance of the `FeatureModule` class.
   *
   * @param spaceClient - An instance of `SpaceClient` used to interact with the Space API.
   */
  constructor(spaceClient: SpaceClient) {
    this.spaceClient = spaceClient;
  }

  /**
   * Evaluates a feature for a specific user by sending a request to the Space API.
   * 
   * @param userId - The ID of the user for whom the feature is being evaluated.
   * @param featureId - The ID of the feature to be evaluated (i.e. \`${serviceName}-${featureName}\`).
   * @param expectedConsumption - An optional record of expected consumption values for the feature.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the operation fails.
   */
  public async evaluate(
    userId: string,
    featureId: string,
    expectedConsumption: Record<string, number> = {}
  ) {
    axios
      .post(`${this.spaceClient.httpUrl}/features/${userId}/${featureId}`, expectedConsumption, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error evaluating feature:', error);
        throw error;
      });
  }
}
