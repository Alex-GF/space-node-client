import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { SpaceClient } from '../config/SpaceClient';
import { FallbackSubscription } from '../types';

/**
 * The `ServiceModule` class provides methods to interact with a SpaceClient instance
 * for managing services and their pricing availability. It includes functionality
 * to add services either from a remote URL or a local file and to change the availability
 * status of a pricing version for a specific service.
 */
export class ServiceModule {
  private spaceClient: SpaceClient;

  /**
   * Creates an instance of the `ServiceModule` class.
   *
   * @param spaceClient - An instance of `SpaceClient` used to interact with the Space API.
   */
  constructor(spaceClient: SpaceClient) {
    this.spaceClient = spaceClient;
  }

  /**
   * Adds a new service to the Space platform. The service can be added either by providing
   * a remote URL or a local file path. If the client is not connected to Space, an error is thrown.
   *
   * @param url - The URL or file path of the service to be added.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the client is not connected to Space or if the operation fails.
   */
  public async addService(url: string) {
    if (!(await this.spaceClient.isConnectedToSpace())) {
      throw new Error('Not connected to Space. Please connect before adding a service.');
    }

    const isRemoteUrl = /^(http|https):\/\//.test(url);

    if (isRemoteUrl) {
      return await this._addServiceWithUrl(url);
    } else {
      // Resolve the path relative to the current working directory (process.cwd())
      const resolvedPath = path.resolve(process.cwd(), url);

      return await this._addServiceWithFile(resolvedPath);
    }
  }

  /**
   * Changes the availability status of a specific pricing version for a service.
   * The availability can be set to either "active" or "archived". If archiving,
   * a fallback subscription must be provided to ensure existing contracts are novated.
   *
   * @param serviceName - The name of the service whose pricing availability is being changed.
   * @param pricingVersion - The version of the pricing to update.
   * @param newAvailability - The new availability status ("active" or "archived").
   * @param fallbackSubscription - (Optional) A fallback subscription required when archiving.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the availability status is invalid, if no fallback subscription is provided when archiving, or if the operation fails.
   */
  async changePricingAvailability(
    serviceName: string,
    pricingVersion: string,
    newAvailability: 'active' | 'archived',
    fallbackSubscription?: FallbackSubscription
  ) {
    if (newAvailability !== 'active' && newAvailability !== 'archived') {
      throw new Error('Invalid availability status. Use "active" or "archived".');
    }

    if (newAvailability === 'archived' && !fallbackSubscription) {
      throw new Error(
        "You must provide a fallback subscription before archiving. When archiving a pricing version, you must provide a valid subscription in the most recent version of the service's pricing in order to novate all existing contracts to it"
      );
    }

    axios
      .put(
        `${this.spaceClient.httpUrl}/services/${serviceName}/pricings/${pricingVersion}?availability=${newAvailability}`,
        fallbackSubscription,
        {
          headers: {
            'x-api-key': this.spaceClient.apiKey,
          },
          timeout: this.spaceClient.timeout,
        }
      )
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error archiving pricing:', error);
        throw error;
      });
  }

  /**
   * Adds a service to the Space platform using a local file.
   *
   * @param filePath - The path to the file to upload.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the operation fails.
   * @private
   */
  private async _addServiceWithFile(filePath: string): Promise<any> {
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    form.append('pricing', fileStream, path.basename(filePath));

    return axios
      .post(`${this.spaceClient.httpUrl}/services`, form, {
        headers: {
          ...form.getHeaders(),
          'x-api-key': this.spaceClient.apiKey,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error adding service with file:', error.response.data);
        throw error;
      });
  }

  /**
   * Adds a service to the Space platform using a remote URL.
   *
   * @param pricingUrl - The URL of the service's pricing data.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the operation fails.
   * @private
   */
  private async _addServiceWithUrl(pricingUrl: string): Promise<any> {
    axios
      .post(
        `${this.spaceClient.httpUrl}/services`,
        {
          pricing: pricingUrl,
        },
        {
          headers: {
            'x-api-key': this.spaceClient.apiKey,
          },
          timeout: this.spaceClient.timeout,
        }
      )
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error adding service with file:', error);
        throw error;
      });
  }
}
