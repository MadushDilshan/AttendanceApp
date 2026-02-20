import { apiClient } from './apiClient';
import type { AttendanceRecord, AttendanceOverviewItem } from '../types/api.types';

export async function getTodayOverview(): Promise<AttendanceOverviewItem[]> {
  const res = await apiClient.get<{ date: string; overview: AttendanceOverviewItem[] }>('/admin/attendance/today');
  return res.data.overview;
}

export async function queryHistory(params: {
  employeeId?: string;
  from: string;
  to: string;
  status?: string;
}): Promise<AttendanceRecord[]> {
  const res = await apiClient.get<{ records: AttendanceRecord[]; totalCount: number }>('/admin/attendance', {
    params: { employeeId: params.employeeId, startDate: params.from, endDate: params.to, status: params.status },
  });
  return res.data.records;
}

export async function manualClose(id: string, body: { checkOutAt: string; adjustmentNote: string }): Promise<AttendanceRecord> {
  const res = await apiClient.patch<{ record: AttendanceRecord }>(`/admin/attendance/${id}/close`, body);
  return res.data.record;
}
