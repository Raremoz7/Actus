import crypto from "node:crypto";
export function uuid() {
    return crypto.randomUUID();
}
export function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("base64url");
}
export function sha256(input) {
    return crypto.createHash("sha256").update(input).digest("hex");
}
