import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { acquireApiToken } from "./api/client";
import { decodeJwt } from "./lib/jwt";

export type AppRole = "admin" | "operador" | "cliente";

type RolesState = {
  loading: boolean;
  roles: AppRole[];
};

function isAppRole(value: string): value is AppRole {
  return (
    value === "admin" ||
    value === "operador" ||
    value === "cliente"
  );
}

export function useRoles(): RolesState {
  const { instance, accounts } = useMsal();

  const [state, setState] = useState<RolesState>({
    loading: true,
    roles: []
  });

  useEffect(() => {
    const account = accounts[0] ?? instance.getActiveAccount();

    if (!account) {
      setState({
        loading: false,
        roles: []
      });
      return;
    }

    let cancelled = false;

    const loadRoles = async () => {
      try {
        const accessToken = await acquireApiToken(instance, account);

        if (cancelled) {
          return;
        }

        const tokenRoles = decodeJwt(accessToken)?.roles ?? [];

        console.log("Roles del access token:", tokenRoles);

        setState({
          loading: false,
          roles: tokenRoles.filter(isAppRole)
        });
      } catch (error) {
        console.error("No fue posible obtener los roles:", error);

        if (!cancelled) {
          setState({
            loading: false,
            roles: []
          });
        }
      }
    };

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, [accounts, instance]);

  return state;
}