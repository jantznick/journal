import crypto from 'crypto';

export function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

/** Six-digit string 000000–999999 for email OTP (stored hashed). */
export function generateOtp6() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}
