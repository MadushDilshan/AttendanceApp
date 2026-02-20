import { apiClient } from './apiClient';
import type { Paysheet } from '../types/api.types';

export async function generate(body: {
  periodStart: string;
  periodEnd: string;
  employeeIds: string[];
}): Promise<Paysheet> {
  const res = await apiClient.post<{ paysheet: Paysheet }>('/admin/paysheets/generate', body);
  return res.data.paysheet;
}

export async function getById(id: string): Promise<Paysheet> {
  const res = await apiClient.get<{ paysheet: Paysheet }>(`/admin/paysheets/${id}`);
  return res.data.paysheet;
}

export async function markProcessed(id: string): Promise<Paysheet> {
  const res = await apiClient.patch<{ paysheet: Paysheet }>(`/admin/paysheets/${id}`, { status: 'processed' });
  return res.data.paysheet;
}

export async function exportPaysheet(id: string, format: 'pdf' | 'csv'): Promise<void> {
  const res = await apiClient.get(`/admin/paysheets/${id}/export`, {
    params: { format },
    responseType: 'blob',
  });
  const blob = new Blob([res.data as BlobPart], {
    type: format === 'pdf' ? 'application/pdf' : 'text/csv',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `paysheet.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
