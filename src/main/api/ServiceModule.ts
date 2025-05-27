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
   * Retrieves the details of a specific service by its name from the Space API.
   *
   * @param serviceName - The name of the service to retrieve.
   * @returns A promise that resolves with the service details as an object.
   * @throws An error if the client is not connected to Space or if the request fails.
   *
   * @remarks
   * This method checks if the client is connected to Space before making the request.
   * If the client is not connected, it throws an error. The request is made using
   * the Axios library, and it includes the API key in the headers for authentication.
   * If the request fails, the error is logged to the console and rethrown.
   *
   * @example
   * ```typescript
   * try {
   *   const serviceDetails = await serviceModule.getService('exampleService');
   *   console.log(serviceDetails);
   * } catch (error) {
   *   console.error('Failed to retrieve service:', error);
   * }
   * ```
   */
  public async getService(serviceName: string) {
    if (!(await this.spaceClient.isConnectedToSpace())) {
      throw new Error('Not connected to Space. Please connect before retrieving a service.');
    }

    return await axios
      .get(`${this.spaceClient.httpUrl}/services/${serviceName}`, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error retrieving service:', error.response?.data || error);
        throw error;
      });
  }

  /**
   * Retrieves the pricing information for a specific service and pricing version.
   *
   * @param serviceName - The name of the service for which pricing information is requested.
   * @param pricingVersion - The version of the pricing to retrieve.
   * @returns A promise that resolves to the pricing data.
   * @throws An error if the client is not connected to Space or if the request fails.
   *
   * @remarks
   * This method requires the client to be connected to Space before making the request.
   * It uses the Space client's HTTP URL and API key for authentication.
   *
   * @example
   * ```typescript
   * try {
   *   const pricing = await serviceModule.getPricing('exampleService', 'v1');
   *   console.log(pricing);
   * } catch (error) {
   *   console.error('Failed to retrieve pricing:', error);
   * }
   * ```
   */
  public async getPricing(serviceName: string, pricingVersion: string) {
    if (!(await this.spaceClient.isConnectedToSpace())) {
      throw new Error('Not connected to Space. Please connect before retrieving pricing.');
    }

    return await axios
      .get(`${this.spaceClient.httpUrl}/services/${serviceName}/pricings/${pricingVersion}`, {
        headers: {
          'x-api-key': this.spaceClient.apiKey,
        },
        timeout: this.spaceClient.timeout,
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Error retrieving pricing:', error.response?.data || error);
        throw error;
      });
  }

  /**
   * Adds a new service to the Space platform. The service can be added either by providing
   * a remote URL or a local file path. If the client is not connected to Space, an error is thrown.
   *
   * @param url - The URL or file path of the service to be added (**from the root of the project**).
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the client is not connected to Space or if the operation fails.
   */
  public async addService(url: string) {
    if (!(await this.spaceClient.isConnectedToSpace())) {
      throw new Error('Not connected to Space. Please connect before adding a service.');
    }
    const isRemoteUrl = /^(http|https):\/\//.test(url);
    if (isRemoteUrl) {
      return await this._postWithUrl(`${this.spaceClient.httpUrl}/services`, url);
    } else {
      const resolvedPath = path.resolve(process.cwd(), url);
      return await this._postWithFile(`${this.spaceClient.httpUrl}/services`, resolvedPath);
    }
  }

  /**
   * This method allows you to add pricing information to an existing service in Space.
   * It supports both remote URLs and local file paths for the pricing data.
   * If the provided URL is a remote URL, it will be sent directly to the Space API.
   * If it's a local file path, the file will be read and sent as multipart/form-data.
   * The service must already exist in Space, and the pricing data must be valid.
   * If the service does not exist or the pricing data is invalid, an error will be thrown.
   * @param serviceName - The name of the service to which the pricing is being added.
   * This should be the name of the service as it appears in Space.
   * @param url - The URL or file path of the pricing data to be added.
   * If the URL is a remote URL, it will be sent directly. If it's a local file path,
   * the file will be read and sent as multipart/form-data.
   * The file path should be relative to the root of the project.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the client is not connected to Space or if the operation fails.
   * @throws An error if the service does not exist or if the pricing data is invalid.
   */
  public async addPricing(serviceName: string, url: string) {
    if (!(await this.spaceClient.isConnectedToSpace())) {
      throw new Error('Not connected to Space. Please connect before adding a service.');
    }
    const isRemoteUrl = /^(http|https):\/\//.test(url);
    const endpoint = `${this.spaceClient.httpUrl}/services/${serviceName}/pricings`;
    if (isRemoteUrl) {
      return await this._postWithUrl(endpoint, url);
    } else {
      const resolvedPath = path.resolve(process.cwd(), url);
      return await this._postWithFile(endpoint, resolvedPath);
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
  ): Promise<any> {
    if (newAvailability !== 'active' && newAvailability !== 'archived') {
      throw new Error('Invalid availability status. Use "active" or "archived".');
    }

    if (newAvailability === 'archived' && !fallbackSubscription) {
      throw new Error(
        "You must provide a fallback subscription before archiving. When archiving a pricing version, you must provide a valid subscription in the most recent version of the service's pricing in order to novate all existing contracts to it"
      );
    }

    return await axios
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
   * Sends a POST request to the specified endpoint with a file as multipart/form-data.
   * The file is sent under the 'pricing' field with its original filename.
   *
   * @param endpoint - The API endpoint to which the file will be uploaded.
   * @param filePath - The absolute path to the file to upload.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the operation fails.
   * @private
   */
  private async _postWithFile(endpoint: string, filePath: string): Promise<any> {
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    form.append('pricing', fileStream, path.basename(filePath));
    try {
      const response = await axios.post(endpoint, form, {
        headers: {
          ...form.getHeaders(),
          'x-api-key': this.spaceClient.apiKey,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: this.spaceClient.timeout,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding service with file:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Sends a POST request to the specified endpoint with a remote pricing URL.
   * The URL is sent in the request body under the 'pricing' field.
   *
   * @param endpoint - The API endpoint to which the URL will be sent.
   * @param pricingUrl - The remote URL of the pricing data.
   * @returns A promise that resolves with the response data from the Space API.
   * @throws An error if the operation fails.
   * @private
   */
  private async _postWithUrl(endpoint: string, pricingUrl: string): Promise<any> {
    return await axios
      .post(
        endpoint,
        { pricing: pricingUrl },
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
        console.error('Error adding service/pricing:', error.response.data);
        throw error;
      });
  }
}
