import axios from "../../lib/axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Service } from "../../types/service";

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