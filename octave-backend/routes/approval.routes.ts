import { Router } from "express";
import { ApprovalRepository } from "../repository/approval.repository";
import { ApprovalService } from "../service/approval.service";
import { ApprovalController } from "../controller/approval.controller";

const approvalRepo = new ApprovalRepository();
const approvalService = new ApprovalService(approvalRepo);
const approvalController = new ApprovalController(approvalService);

const router = Router();

router.get("/", approvalController.getApprovedItems.bind(approvalController));
router.post("/pay", approvalController.initiatePayment.bind(approvalController));
router.post("/pay/confirm", approvalController.confirmPayment.bind(approvalController));
router.post("/reject", approvalController.rejectItems.bind(approvalController));

export default router;
