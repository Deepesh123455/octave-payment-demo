import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { UtilityRepository } from "../repository/utility.repository";
import { UtilityService } from "../service/utility.service";
import { UtilityController } from "../controller/utility.controller";

const prisma = new PrismaClient();
const utilityRepo = new UtilityRepository(prisma);
const utilityService = new UtilityService(utilityRepo);
const utilityController = new UtilityController(utilityService);

const router = Router();

router.get("/", utilityController.getAllUtilities.bind(utilityController));
router.post("/approve", utilityController.approveUtilities.bind(utilityController));
router.post("/reject", utilityController.rejectUtilities.bind(utilityController));

export default router;
