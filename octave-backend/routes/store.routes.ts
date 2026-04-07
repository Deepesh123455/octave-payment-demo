import { Router } from "express";
import { StoreController } from "../controller/store.controller";
import { StoreService } from "../service/store.service";
import { StoreRepository } from "../repository/store.repository";

const router = Router();

// Dependency Injection
const storeRepo = new StoreRepository();
const storeService = new StoreService(storeRepo);
const storeController = new StoreController(storeService);

// Routes
router.get("/", storeController.getAllStores);
router.get("/:id", storeController.getStoreById);
router.patch("/:id/petty-cash-balance", storeController.updatePettyCashBalance);

export default router;