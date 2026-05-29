export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

export function validateRuntimeEnv() {
  if (!ENV.isProduction) return;

  const errors: string[] = [];

  if (!ENV.databaseUrl || ENV.databaseUrl.includes("user:password")) {
    errors.push("DATABASE_URL must be configured for production.");
  }

  if (!ENV.appId) {
    errors.push("VITE_APP_ID must be configured for production.");
  }

  if (
    !ENV.cookieSecret ||
    ENV.cookieSecret === "replace-with-a-long-random-secret" ||
    ENV.cookieSecret.length < 32
  ) {
    errors.push("JWT_SECRET must be a production secret of at least 32 characters.");
  }

  if (errors.length > 0) {
    throw new Error(`Production environment is not ready:\n${errors.join("\n")}`);
  }
}
