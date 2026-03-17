import Location from '../models/Location.model';

export async function createLocation(data: {
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  checkinRadiusMeters?: number;
  overbookingPercent?: number;
}): Promise<any> {
  return Location.create({
    name: data.name,
    city: data.city,
    address: data.address,
    coordinates: { lat: data.lat, lng: data.lng },
    checkinRadiusMeters: data.checkinRadiusMeters || 500,
    overbookingPercent: data.overbookingPercent || 5,
  });
}

export async function listLocations(city?: string): Promise<any[]> {
  const query: any = { isActive: true };
  if (city) query.city = city;
  return Location.find(query).sort({ city: 1, name: 1 });
}

export async function updateLocation(locationId: string, data: Partial<{
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  checkinRadiusMeters: number;
  overbookingPercent: number;
  isActive: boolean;
}>): Promise<any> {
  const location = await Location.findById(locationId);
  if (!location) {
    throw Object.assign(new Error('Location not found'), { statusCode: 404 });
  }

  if (data.name !== undefined) location.name = data.name;
  if (data.city !== undefined) location.city = data.city;
  if (data.address !== undefined) location.address = data.address;
  if (data.lat !== undefined && data.lng !== undefined) {
    location.coordinates = { lat: data.lat, lng: data.lng };
  }
  if (data.checkinRadiusMeters !== undefined) location.checkinRadiusMeters = data.checkinRadiusMeters;
  if (data.overbookingPercent !== undefined) location.overbookingPercent = data.overbookingPercent;
  if (data.isActive !== undefined) location.isActive = data.isActive;

  await location.save();
  return location;
}

export async function deleteLocation(locationId: string): Promise<void> {
  const location = await Location.findById(locationId);
  if (!location) {
    throw Object.assign(new Error('Location not found'), { statusCode: 404 });
  }
  // Soft-delete by deactivating so existing assignments keep their reference
  location.isActive = false;
  await location.save();
}
