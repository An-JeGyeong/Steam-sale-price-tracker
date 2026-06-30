import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET 환경변수가 없습니다.");
  return s;
}

export function signValue(value: string): string {
  const sig = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

export function verifyValue(signed: string): string | null {
  const dot = signed.lastIndexOf(".");
  if (dot < 0) return null;
  const value = signed.slice(0, dot);
  const sigHex = signed.slice(dot + 1);
  let sig: Buffer, expected: Buffer;
  try {
    sig = Buffer.from(sigHex, "hex");
    expected = Buffer.from(
      createHmac("sha256", secret()).update(value).digest("hex"),
      "hex"
    );
  } catch {
    return null;
  }
  if (sig.length === 0 || sig.length !== expected.length) return null;
  if (!timingSafeEqual(sig, expected)) return null;
  return value;
}
