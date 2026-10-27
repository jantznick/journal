import * as client from 'openid-client';

let oidcConfig = null;

export function isOidcConfigured() {
  return Boolean(
    process.env.OIDC_ISSUER_URL &&
      process.env.OIDC_CLIENT_ID &&
      process.env.OIDC_CLIENT_SECRET,
  );
}

export async function initializeOIDC() {
  if (oidcConfig) return oidcConfig;
  if (!isOidcConfigured()) {
    throw new Error('OIDC is not configured');
  }

  oidcConfig = await client.discovery(
    new URL(process.env.OIDC_ISSUER_URL),
    process.env.OIDC_CLIENT_ID,
    process.env.OIDC_CLIENT_SECRET,
  );
  return oidcConfig;
}

export function getOIDCConfig() {
  if (!oidcConfig) {
    throw new Error('OIDC not initialized. Call initializeOIDC() first.');
  }
  return oidcConfig;
}

export async function buildAuthorizationUrl(state, codeVerifier) {
  const config = getOIDCConfig();
  const redirectUri = process.env.OIDC_REDIRECT_URI;
  const scope = process.env.OIDC_SCOPE || 'openid profile email';
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

  return client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });
}

export async function exchangeCodeForTokens(currentUrl, codeVerifier, expectedState) {
  const config = getOIDCConfig();
  return client.authorizationCodeGrant(config, new URL(currentUrl), {
    pkceCodeVerifier: codeVerifier,
    expectedState,
  });
}

export function generateState() {
  return client.randomState();
}

export function generateCodeVerifier() {
  return client.randomPKCECodeVerifier();
}
