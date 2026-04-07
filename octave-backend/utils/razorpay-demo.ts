export interface DemoAwareAmount {
  actualAmountRupees: number;
  actualAmountPaise: number;
  gatewayAmountPaise: number;
  gatewayAmountRupees: number;
  isDemoCapped: boolean;
}

const TEST_MODE_MAX_PAISE = 1000000;
const DEMO_GATEWAY_PAISE = 100;

export const getDemoAwareAmount = (actualAmountRupees: number, razorpayKey?: string): DemoAwareAmount => {
  const actualAmountPaise = Math.round(actualAmountRupees * 100);
  const isTestMode = razorpayKey?.startsWith("rzp_test_") ?? false;
  const isDemoCapped = isTestMode && actualAmountPaise > TEST_MODE_MAX_PAISE;
  const gatewayAmountPaise = isDemoCapped ? DEMO_GATEWAY_PAISE : actualAmountPaise;

  return {
    actualAmountRupees,
    actualAmountPaise,
    gatewayAmountPaise,
    gatewayAmountRupees: gatewayAmountPaise / 100,
    isDemoCapped,
  };
};
