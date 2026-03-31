import { Router } from "express";
import { RentController } from "../controller/rent.controller";
import { RentService } from "../service/rent.service";
import { RentRepository } from "../repository/rent.repository";
import { NotificationRepository } from "../repository/notification.repository";

const router = Router();

// Dependency Injection
const notificationRepo = new NotificationRepository();
const rentRepo = new RentRepository();
const rentService = new RentService(rentRepo, notificationRepo);
const rentController = new RentController(rentService);

// Routes
router.get("/", rentController.getRentPayments);
router.post("/initiate", rentController.initiatePayment);
router.post("/confirm", rentController.confirmPayment);
router.post("/approve", rentController.approvePayments);
router.post("/reject", rentController.rejectPayments);

export default router;
