import { Router } from "express";
import { PettyCashController } from "../controller/petty-cash.controller";
import { PettyCashService } from "../service/petty-cash.service";
import { PettyCashRepository } from "../repository/petty-cash.repository";
import { NotificationRepository } from "../repository/notification.repository";

const router = Router();
const notificationRepo = new NotificationRepository();
const pettyCashRepo = new PettyCashRepository();
const pettyCashService = new PettyCashService(pettyCashRepo, notificationRepo);
const pettyCashController = new PettyCashController(pettyCashService);

// Routes
router.get("/", pettyCashController.getAllRequests);
router.post("/", pettyCashController.createRequest);
router.post("/approve", pettyCashController.approveRequests);
router.post("/reject", pettyCashController.rejectRequests);

export default router;
