import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { acquireApiToken } from "./api/client"; // el mismo helper de la sección 6
import { decodeJwt } from "./lib/jwt";

export function RequireRole({ role }: { role: string }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? instance.getActiveAccount();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    acquireApiToken(instance, account)
      .then((token) => {
        if (cancelled) return;
        const roles = decodeJwt(token)?.roles ?? [];
        setStatus(roles.includes(role) ? "allowed" : "denied");
      })
      .catch(() => !cancelled && setStatus("denied"));
    return () => { cancelled = true; };
  }, [instance, account, role]);

  if (!account || status === "loading") return <p>Verificando permisos…</p>;
  if (status === "denied") return <p>Requiere el rol {role}.</p>;
  return <Outlet />;
}