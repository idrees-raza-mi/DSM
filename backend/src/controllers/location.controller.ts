import { Request, Response, NextFunction } from 'express';
import * as locationService from '../services/location.service';
import { sendSuccess, sendCreated } from '../utils/response';

export async function createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const location = await locationService.createLocation(req.body);
    sendCreated(res, location, 'Location created');
  } catch (err) {
    next(err);
  }
}

export async function listLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { city } = req.query;
    const locations = await locationService.listLocations(city as string);
    sendSuccess(res, locations);
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const location = await locationService.updateLocation(req.params.id, req.body);
    sendSuccess(res, location, 'Location updated');
  } catch (err) {
    next(err);
  }
}
