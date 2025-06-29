import axios from 'axios';
import { SpaceClient } from '../config/SpaceClient';
import {FeatureEvaluationResult } from '../types';

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
    expectedConsumption: Record<string, number> = {},
    options: {details?: boolean, server?: boolean} = {}
  ): Promise<FeatureEvaluationResult> {

    const queryParams = [];
    if (options.details) {
      queryParams.push("details=true");
    }
    if (options.server) {
      queryParams.push("server=true");
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    return await axios
      .post(`${this.spaceClient.httpUrl}/features/${userId}/${featureId}${queryString}`, expectedConsumption, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error evaluating feature:', error.response.data);
        throw error;
      });
  }

  /**
   * Reverts the optimistic usage level update performed during a previous evaluation with SPACE.
   * This method is expected to be used when the transaction of the request has failed in the aplication, and therefore no usage should be charged to the user.
   * @param userId - The ID of the user for whom the feature is being evaluated.
   * @param featureId - The ID of the feature to be evaluated (i.e. \`${serviceName}-${featureName}\`).
   * @param revertToLatest - A boolean indicating whether to reset to the latest stored value in the optimistic cache (`true => newest` | `false => oldest`).
   * @returns A promise that resolves to `true` if the revert operation was successful, otherwise it throws an error.
   * @throws An error if the operation fails.
   */
  public async revertEvaluation(userId: string, featureId: string, revertToLatest: boolean = true): Promise<boolean> {
    return await axios
      .post(`${this.spaceClient.httpUrl}/features/${userId}?revert=true&latest=${revertToLatest}`, {}, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(() => {
        return true;
      })
      .catch(error => {
        console.error(`Error reverting usage level for evaluation of feature ${featureId} for user ${userId}:`, error.response.data);
        throw error;
      });
  }

  /**
   * Generates a pricing token for a user by sending a request to the Space API.
   * This token can be used to retrieve pricing information for the user or to 
   * activate/deactivate UI components without providing access to the SPACE API from 
   * the internet.
   * 
   * @param userId - The ID of the user for whom the pricing token is being generated.
   * @returns A promise that resolves with the generated pricing token.
   * @throws An error if the operation fails.
   */
  public async generateUserPricingToken(userId: string): Promise<string> {
    return await axios
      .post(`${this.spaceClient.httpUrl}/features/${userId}/pricing-token`, {}, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data.pricingToken;
      })
      .catch(error => {
        try{
          console.error('Error generating user pricing token:', error.response.error);
        }finally {
          throw error;
        }
      });
  }
}
