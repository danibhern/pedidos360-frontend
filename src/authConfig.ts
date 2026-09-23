import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI
  },
  cache: {
    cacheLocation: "localStorage"
  }
};

export const loginRequest = {
  scopes: ["openid", "profile"]
};

export const apiRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE]
};

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  scopes: [import.meta.env.VITE_API_SCOPE]
};