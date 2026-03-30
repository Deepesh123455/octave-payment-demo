import { Request, Response, NextFunction } from "express";
import { IStoreService } from "../interfaces/store.interface";
import { ApiError } from "../utils/AppError";

export class StoreController {
  constructor(private storeService: IStoreService) {}

  getAllStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stores = await this.storeService.getAllStores();
      res.status(200).json({
        status: "success",
        results: stores.length,
        data: stores,
      });
    } catch (error) {
      next(error);
    }
  };

  getStoreById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const store = await this.storeService.getStoreById(id);

      if (!store) {
        throw new ApiError(`Store with ID ${id} not found`, 404);
      }

      res.status(200).json({
        status: "success",
        data: store,
      });
    } catch (error) {
      next(error);
    }
  };
}
