import { apiClient } from './apiClient';
import type { Employee } from '../types/api.types';

export async function login(email: string, password: string): Promise<{ accessToken: string; employee: Employee }> {
  const res = await apiClient.post<{ accessToken: string; employee: Employee }>('/auth/login', { email, password });
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
