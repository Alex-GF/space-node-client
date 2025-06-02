import axios from 'axios';
import type { AxiosInstance } from 'axios';

export const TEST_SPACE_URL = 'http://localhost:3000';
export const TEST_API_KEY = '9cedd24632167a021667df44a26362dfb778c1566c3d4564e132cb58770d8c67';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${TEST_SPACE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': TEST_API_KEY,
  },
});

export default axiosInstance;