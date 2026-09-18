import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
  },
  cache: { cacheLocation: "localStorage" },
};

// Login inicial: basta identidad
export const loginRequest = { scopes: ["openid", "profile"] };

// OJO: para llamar al backend pedimos el scope de NUESTRA API
export const apiRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE],
};

// ✅ Este objeto lo espera tu client.ts
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  scopes: [import.meta.env.VITE_API_SCOPE],
};
