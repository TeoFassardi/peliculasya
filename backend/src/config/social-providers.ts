const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error(
    "Completá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET juntos, o dejá ambos vacíos.",
  );
}

export const googleProvider =
  googleClientId && googleClientSecret
    ? { clientId: googleClientId, clientSecret: googleClientSecret, requireEmailVerification: true }
    : undefined;

export const publicConfig = { googleEnabled: Boolean(googleProvider) };
