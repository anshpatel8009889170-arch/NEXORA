import Razorpay from "razorpay";

export function getRazorpayClient() {
  const keyId =
    process.env.RAZORPAY_KEY ||
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "";

  const keySecret =
    process.env.RAZORPAY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "";

  if (!keyId || !keySecret || keyId === "rzp_test_nexora_demo") {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}
