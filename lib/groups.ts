export type Group = {
  id: number;
  name: string;
  description: string;
  color: string;
  count: number;
};

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const initialGroups: Group[] = [
  { id: 1, name: 'VIP Clients', description: 'High value customers', color: '#10b981', count: 24 },
  { id: 2, name: 'Leads', description: 'Potential customers', color: '#3b82f6', count: 58 },
  { id: 3, name: 'Inactive', description: 'No activity in 90 days', color: '#ef4444', count: 12 },
];
