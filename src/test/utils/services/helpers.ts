import axios from "../../lib/axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Service } from "../../types/service";

export async function getService(serviceName: string): Promise<Service | null> {
  try {
    const response = await axios.get(`/services/${serviceName}`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // Service not found
    }
    console.error('Error fetching service:', error.message);
    throw new Error(`Failed to get service: ${error.message}`);
  }
}

export async function addService(filePath: string): Promise<Service>{
  const form = new FormData();
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const fileStream = fs.createReadStream(resolvedPath);
  form.append('pricing', fileStream, path.basename(resolvedPath));
  try {
    const response = await axios.post("/services", form, {
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
    if (error.response) {
      console.error('Error response from server:', error.response.data);
      throw new Error(`Failed to add service: ${error.response.data.message}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to add service: No response from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error(`Failed to add service: ${error.message}`);
    }
  }
}