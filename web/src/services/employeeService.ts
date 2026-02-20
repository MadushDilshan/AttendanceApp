import { apiClient } from './apiClient';
import type { Employee } from '../types/api.types';

export async function listEmployees(params?: { status?: string; workplaceId?: string }): Promise<Employee[]> {
  const res = await apiClient.get<{ employees: Employee[] }>('/admin/employees', { params });
  return res.data.employees;
}

export async function createEmployee(body: {
  name: string; email: string; password: string; role: string; workplaceId?: string;
}): Promise<Employee> {
  const res = await apiClient.post<{ employee: Employee }>('/admin/employees', body);
  return res.data.employee;
}

export async function updateEmployee(id: string, body: { name?: string; role?: string; workplaceId?: string }): Promise<Employee> {
  const res = await apiClient.put<{ employee: Employee }>(`/admin/employees/${id}`, body);
  return res.data.employee;
}

export async function setEmployeeStatus(id: string, status: 'active' | 'inactive'): Promise<Employee> {
  const res = await apiClient.patch<{ employee: Employee }>(`/admin/employees/${id}/status`, { status });
  return res.data.employee;
}
