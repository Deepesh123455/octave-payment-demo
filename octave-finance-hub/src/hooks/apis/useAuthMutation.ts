// src/hooks/useAuthMutations.ts
import { useMutation } from "@tanstack/react-query";
import { VerifyOtpPayload, verifyOtpRequest } from "@/api/api.auth";
import { useLoginFlowStore } from "@/store/useLoginFLowStore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const useVerifyOtp = () => {
  const navigate = useNavigate();
  const clearFlow = useLoginFlowStore((state) => state.clearFlow);
  const { login } = useAuth();

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtpRequest(payload),
    onSuccess: (data) => {
      console.log("✅ Login Successful!", data);
      
      // Use the login function from context to update state and storage
      login(data.data.token, data.data.admin);

      // Send them to the protected dashboard!
      navigate("/");

      // Wipe the temporary OTP screen memory
      clearFlow();
    },
  });
};