import axios from 'axios';
import type { AxiosInstance } from 'axios';

export const TEST_SPACE_URL = process.env.SPACE_TEST_URL ?? 'http://localhost:3000';
export const TEST_API_KEY = process.env.SPACE_TEST_API_KEY ?? 'org_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${TEST_SPACE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': TEST_API_KEY,
  },
});

export default axiosInstance;