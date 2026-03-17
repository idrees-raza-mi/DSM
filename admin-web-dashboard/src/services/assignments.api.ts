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

  const getAssignment = (id: string) =>
    client.get(`/admin/assignments/${id}`);

  const updateAssignment = (id: string, data: {
    requiredDrivers?: number;
    compensation?: number;
    checkinCode?: string;
    timeSlot?: string;
  }) => client.put(`/admin/assignments/${id}`, data);

  const deleteAssignment = (id: string) =>
    client.delete(`/admin/assignments/${id}`);

  const setAssignmentActive = (id: string, isActive: boolean) =>
    client.patch(`/admin/assignments/${id}/active`, { isActive });

  const updateLocation = (id: string, data: {
    name?: string; city?: string; address?: string;
    checkinRadiusMeters?: number; overbookingPercent?: number;
  }) => client.put(`/admin/locations/${id}`, data);

  const deleteLocation = (id: string) =>
    client.delete(`/admin/locations/${id}`);

  return {
    listAssignments,
    createAssignment,
    getAssignment,
    updateAssignment,
    deleteAssignment,
    setAssignmentActive,
    listLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  };
};
