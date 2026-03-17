import { useAuthorizedClient } from './api';

export const useAssignmentsApi = () => {
  const client = useAuthorizedClient();

  const listAssignments = (params?: { date?: string; locationId?: string; city?: string }) =>
    client.get('/admin/assignments', { params });

  const createAssignment = (data: {
    locationId: string;
    date: string;
    timeSlot: string;
    requiredDrivers: number;
    compensation: number;
  }) => client.post('/admin/assignments', data);

  const listLocations = (city?: string) =>
    client.get('/admin/locations', { params: city ? { city } : {} });

  const createLocation = (data: {
    name: string;
    city: string;
    address: string;
    lat: number;
    lng: number;
    checkinRadiusMeters?: number;
    overbookingPercent?: number;
  }) => client.post('/admin/locations', data);

  return {
    listAssignments,
    createAssignment,
    listLocations,
    createLocation,
  };
};
