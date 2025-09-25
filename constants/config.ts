import { Platform } from "react-native";

// ---- flip this manually ----
export const IS_DEV = false;

// DEV (local)
const DEV_HOST =
  Platform.OS === "android" ? "http://10.0.2.2" : "http://127.0.0.1";
const DEV_WEB_PORT = 3000;
const DEV_API_PORT = 3001;

// PROD (same origin, pick one of these)
const PROD_ORIGIN = "https://www.paliaflorina.gr";
// If your canonical domain is www, use this instead:
// const PROD_ORIGIN = "https://www.paliaflorina.gr";

export const WEB_BASE_URL = IS_DEV
  ? `${DEV_HOST}:${DEV_WEB_PORT}`
  : PROD_ORIGIN;
export const API_BASE_URL = IS_DEV
  ? `${DEV_HOST}:${DEV_API_PORT}`
  : PROD_ORIGIN;

export const SIGN_IN_URL = `${API_BASE_URL}/sign-in`;
export const NATIVE_SESSION_URL = `${API_BASE_URL}/native-session`;
export const SESSION_URL = `${API_BASE_URL}/session`;
export const FORGOT_PASSWORD_URL = `${API_BASE_URL}/forgot-password`;
export const BASE_URL = WEB_BASE_URL;

// DEBUG: leave these logs until you confirm it hits prod
console.log("[CFG] WEB_BASE_URL:", WEB_BASE_URL);
console.log("[CFG] API_BASE_URL:", API_BASE_URL);
console.log("[CFG] SIGN_IN_URL:", SIGN_IN_URL);
