export interface DemoStaffMember {
  id: string;
  name: string;
  role: 'manager' | 'chef_cuisinier' | 'serveur' | 'hotesse';
  hourlyRateEur: number;
  contractType: 'CDI' | 'CDD';
  hoursPerWeek: number;
}

export const DEMO_STAFF: DemoStaffMember[] = [
  { id: 'emp_mgr_1', name: 'Marc Manager', role: 'manager', hourlyRateEur: 18.5, contractType: 'CDI', hoursPerWeek: 35 },
  { id: 'emp_chef_1', name: 'Antoine Chef', role: 'chef_cuisinier', hourlyRateEur: 17.0, contractType: 'CDI', hoursPerWeek: 35 },
  { id: 'emp_srv_1', name: 'Sophie Serveuse', role: 'serveur', hourlyRateEur: 12.5, contractType: 'CDI', hoursPerWeek: 35 },
  { id: 'emp_hot_1', name: 'Claire Hôtesse', role: 'hotesse', hourlyRateEur: 12.0, contractType: 'CDD', hoursPerWeek: 35 },
];
