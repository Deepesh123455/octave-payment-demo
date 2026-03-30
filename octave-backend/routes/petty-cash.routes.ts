import { Router } from "express";
import { PettyCashController } from "../controller/petty-cash.controller";
import { PettyCashService } from "../service/petty-cash.service";
import { PettyCashRepository } from "../repository/petty-cash.repository";

const router = Router();

// Dependency Injection
const pettyCashRepo = new PettyCashRepository();
const pettyCashService = new PettyCashService(pettyCashRepo);
const pettyCashController = new PettyCashController(pettyCashService);

// Routes
router.get("/", pettyCashController.getAllRequests);
router.post("/", pettyCashController.createRequest);
router.post("/approve", pettyCashController.approveRequests);
router.post("/reject", pettyCashController.rejectRequests);

export default router;
