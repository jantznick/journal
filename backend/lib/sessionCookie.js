const isProduction = process.env.NODE_ENV === 'production';

export function sessionCookieOptions() {
  const secure =
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true' || process.env.COOKIE_SECURE === '1'
      : isProduction;

  const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'lax' : 'lax');

  return {
    secure,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  };
}
