import crypto from 'crypto';

export const generateOtp = (): string => {
  // Generates a random integer between 0 and 999999
  const otp = crypto.randomInt(0, 1000000);
  
  // Converts to string and pads with leading zeros (e.g., 42 -> "000042")
  return otp.toString().padStart(6, '0');
};