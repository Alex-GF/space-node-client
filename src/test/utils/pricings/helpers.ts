import path from 'path';
import axios from '../../lib/axios';
import fs from 'fs';
import FormData from 'form-data';
import { TestPricing } from '../../types/pricing';
import { FallbackSubscription } from '../../../main/types';

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
export async function getPricing(
  serviceName: string,
  pricingVersion: string
): Promise<TestPricing> {
  return await axios
    .get(`/services/${serviceName}/pricings/${pricingVersion}`, {
      timeout: 5000,
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Error retrieving pricing:', error.response?.data || error);
      throw error;
    });
}

export async function addPricing(serviceName: string, url: string) {
  const isRemoteUrl = /^(http|https):\/\//.test(url);
  const endpoint = `/services/${serviceName}/pricings`;
  if (isRemoteUrl) {
    return await _postWithUrl(endpoint, url);
  } else {
    const resolvedPath = path.resolve(process.cwd(), url);
    return await _postWithFile(endpoint, resolvedPath);
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
export async function changePricingAvailability(
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
      `/services/${serviceName}/pricings/${pricingVersion}?availability=${newAvailability}`,
      fallbackSubscription,
      {
        timeout: 5000,
      }
    )
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Error archiving pricing:', error.response.data);
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
async function _postWithFile(endpoint: string, filePath: string): Promise<any> {
  const form = new FormData();
  const fileStream = fs.createReadStream(filePath);
  form.append('pricing', fileStream, path.basename(filePath));
  try {
    const response = await axios.post(endpoint, form, {
      headers: {
        ...form.getHeaders(),
        ...axios.defaults.headers.common,
        ...axios.defaults.headers.post,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 5000,
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
async function _postWithUrl(endpoint: string, pricingUrl: string): Promise<any> {
  return await axios
    .post(
      endpoint,
      { pricing: pricingUrl },
      {
        timeout: 5000,
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
