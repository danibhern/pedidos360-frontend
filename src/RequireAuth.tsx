import { Outlet } from "react-router-dom";
import { MsalAuthenticationTemplate } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";

export function RequireAuth() {
  return (
    <MsalAuthenticationTemplate
      interactionType={InteractionType.Redirect}
      authenticationRequest={loginRequest}
      loadingComponent={() => <p>Redirigiendo a inicio de sesión…</p>}
    >
      {/* Todo lo que cuelgue de esta ruta en App.tsx se renderiza acá */}
      <Outlet />
    </MsalAuthenticationTemplate>
  );
}