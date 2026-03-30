// src/hooks/useAuthMutations.ts
import { useMutation } from "@tanstack/react-query";
import { sendOtpRequest,SendOtpPayload } from "@/api/api.auth";
import { useLoginFlowStore } from "@/store/useLoginFLowStore";
import { useNavigate } from "react-router-dom";


export const useSendOtp = () => {
  const navigate = useNavigate();
  const setPendingAuth = useLoginFlowStore((state) => state.setPendingAuth);

  return useMutation({
    mutationFn: (payload: SendOtpPayload) => sendOtpRequest(payload),
    onSuccess: (data, variables) => {
      // 1. Save the email and role to our temporary session store
      setPendingAuth(variables.email, variables.role);
      
      // 2. Redirect to the verification screen
      navigate("/verify-otp");
    },
  });
};