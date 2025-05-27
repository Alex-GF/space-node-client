import axios from 'axios';
import { SpaceClient } from '../config/SpaceClient';
import { Contract, ContractToCreate, Subscription } from '../types';

export class ContractModule {
  private spaceClient: SpaceClient;

  /**
   * Creates an instance of the `ContractModule` class.
   *
   * @param spaceClient - An instance of `SpaceClient` used to interact with the Space API.
   */
  constructor(spaceClient: SpaceClient) {
    this.spaceClient = spaceClient;
  }

  /**
   * Retrieves the contract for a specific user from the Space platform.
   * 
   * @param userId - The ID of the user whose contract is to be retrieved.
   * Retrieves the contract for a specific user from the Space platform.
   * This contract contains information about the user's subscription, billing period, and usage levels.
   * @returns A promise that resolves with the user's contract data.
   * @throws An error if the operation fails.
   */
  public async getContract(userId: string): Promise<Contract> {
    return axios
      .get(`${this.spaceClient.httpUrl}/contracts/${userId}`, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error fetching contract:', error.response.data);
        throw error;
      });
  }

  /**
   * Adds a new contract to the Space platform, so that evaluations for the user who owns the contract can be performed.
   *
   * @param contractToCreate - The contract details to be created.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the operation fails.
   */
  public async addContract(contractToCreate: ContractToCreate): Promise<Contract> {
    return axios
      .post(`${this.spaceClient.httpUrl}/contracts`, contractToCreate, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error adding contract:', error.response.data);
        throw error;
      });
  }

  /**
   * Updates the subscription for a user in the Space platform.
   *
   * @param userId - The ID of the user whose subscription is to be updated.
   * @param newSubscription - The new subscription details to be applied.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the operation fails.
   */
  public async updateContractSubscription(
    userId: string,
    newSubscription: Subscription
  ): Promise<Contract> {
    return axios
      .put(`${this.spaceClient.httpUrl}/contracts/${userId}`, newSubscription, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error updating contract subscription:', error.response.data);
        throw error;
      });
  }
}
