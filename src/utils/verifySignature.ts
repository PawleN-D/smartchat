import crypto from "node:crypto";

interface VerifySignatureInput {
  rawBody: string;
  signatureHeader: string | undefined;
  appSecret: string;
}

export function verifySignature({
  rawBody,
  signatureHeader,
  appSecret,
}: VerifySignatureInput): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;

  const signature = signatureHeader.trim();
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}
