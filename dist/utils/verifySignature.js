import crypto from "node:crypto";
export function verifySignature({ rawBody, signatureHeader, appSecret, }) {
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
