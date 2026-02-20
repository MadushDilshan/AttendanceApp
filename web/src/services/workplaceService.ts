import { apiClient } from './apiClient';
import type { Workplace } from '../types/api.types';

export async function getWorkplace(): Promise<Workplace> {
  const res = await apiClient.get<{ workplace: Workplace }>('/admin/workplace');
  return res.data.workplace;
}

export async function updateWorkplace(body: {
  name?: string;
  location?: { lat: number; lng: number };
  geofenceRadiusMetres?: number;
}): Promise<Workplace> {
  const res = await apiClient.put<{ workplace: Workplace }>('/admin/workplace', body);
  return res.data.workplace;
}

export function getQrImageUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string ?? '/api';
  return `${base}/admin/workplace/qr`;
}

export async function rotateQr(): Promise<void> {
  await apiClient.post('/admin/workplace/qr/rotate');
}
