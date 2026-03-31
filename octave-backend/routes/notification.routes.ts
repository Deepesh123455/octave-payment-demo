import { Router } from "express";
import { NotificationController } from "../controller/notification.controller";
import { NotificationService } from "../service/notification.service";
import { NotificationRepository } from "../repository/notification.repository";

const router = Router();

const notificationRepo = new NotificationRepository();
const notificationService = new NotificationService(notificationRepo);
const notificationController = new NotificationController(notificationService);

router.get("/", (req, res, next) => notificationController.getUnreadNotifications(req, res, next));
router.get("/counts", (req, res, next) => notificationController.getCounts(req, res, next));
router.post("/mark-read", (req, res, next) => notificationController.markRead(req, res, next));

export default router;
