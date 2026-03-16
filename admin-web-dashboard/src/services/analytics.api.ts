import { useAuthorizedClient } from './api';

export const useAnalyticsApi = () => {
  const client = useAuthorizedClient();

  const getOverview = () => client.get('/admin/analytics/overview');
  const getNoShows = () => client.get('/admin/analytics/no-shows');
  const getCancellations = () => client.get('/admin/analytics/cancellations');
  const getLocations = () => client.get('/admin/analytics/locations');
  const getBilling = () => client.get('/admin/analytics/billing');

  return {
    getOverview,
    getNoShows,
    getCancellations,
    getLocations,
    getBilling,
  };
};
