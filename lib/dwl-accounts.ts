type DwlAuthUrlOptions = {
  returnPath?: string;
  returnUrl?: string;
};

export type DwlAccountUser = {
  email: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  id: string;
  image: string | null;
  name: string | null;
};

const DEFAULT_ACCOUNTS_URL = "https://accounts.dylanwlim.com";
const DEFAULT_APP_ID = "games";
const DEFAULT_APP_NAME = "Games";
const DEFAULT_APP_ORIGIN = "https://games.dylanwlim.com";
const DEFAULT_RETURN_PATH = "/auth/callback";

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/u, "");
}

function getCurrentOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return DEFAULT_APP_ORIGIN;
}

export const DWL_ACCOUNTS_URL = withoutTrailingSlash(
  readEnv("NEXT_PUBLIC_DWL_ACCOUNTS_URL") ||
    readEnv("DWL_ACCOUNTS_URL") ||
    DEFAULT_ACCOUNTS_URL,
);
export const DWL_APP_ID =
  readEnv("NEXT_PUBLIC_DWL_APP_ID") || readEnv("DWL_APP_ID") || DEFAULT_APP_ID;
export const DWL_APP_NAME =
  readEnv("NEXT_PUBLIC_DWL_APP_NAME") ||
  readEnv("DWL_APP_NAME") ||
  DEFAULT_APP_NAME;
export const DWL_AUTH_RETURN_URL =
  readEnv("NEXT_PUBLIC_DWL_AUTH_RETURN_URL") ||
  readEnv("DWL_AUTH_RETURN_URL");

export function getDwlAuthReturnUrl(returnPath = DEFAULT_RETURN_PATH) {
  if (returnPath === DEFAULT_RETURN_PATH && DWL_AUTH_RETURN_URL) {
    return DWL_AUTH_RETURN_URL;
  }

  return new URL(returnPath, getCurrentOrigin()).toString();
}

function buildDwlUrl(path: string, options: DwlAuthUrlOptions = {}) {
  const url = new URL(path, DWL_ACCOUNTS_URL);
  const returnUrl =
    options.returnUrl ?? getDwlAuthReturnUrl(options.returnPath ?? DEFAULT_RETURN_PATH);

  url.searchParams.set("app", DWL_APP_ID);
  url.searchParams.set("redirect_uri", returnUrl);

  return url.toString();
}

export function getDwlSignInUrl(options?: DwlAuthUrlOptions) {
  return buildDwlUrl("/sign-in", options);
}

export function getDwlSignUpUrl(options?: DwlAuthUrlOptions) {
  return buildDwlUrl("/sign-up", options);
}

export function getDwlAccountUrl(options?: DwlAuthUrlOptions) {
  return buildDwlUrl("/account", options);
}

export function getDwlSignOutUrl(options?: DwlAuthUrlOptions) {
  return buildDwlUrl("/sign-out", options);
}
