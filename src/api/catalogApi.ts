import type {
  AccountInfo,
  IPublicClientApplication
} from "@azure/msal-browser";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiConfig } from "../authConfig";

export type CatalogProduct = {
  productId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
};

type CatalogResponse = {
  items: CatalogProduct[];
};

export type OrderStatus =
  | "CREADO"
  | "ACEPTADO"
  | "EN_PREPARACION"
  | "DESPACHADO"
  | "ENTREGADO"
  | "CANCELADO";

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  orderId: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  items: Order[];
};

async function getAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo
): Promise<string> {
  try {
    const tokenResponse = await instance.acquireTokenSilent({
      account,
      scopes: apiConfig.scopes
    });

    return tokenResponse.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await instance.acquireTokenRedirect({
        account,
        scopes: apiConfig.scopes
      });
    }

    throw error;
  }
}

export async function getCatalog(
  instance: IPublicClientApplication,
  account: AccountInfo
): Promise<CatalogProduct[]> {
  const accessToken = await getAccessToken(instance, account);

  const response = await fetch(`${apiConfig.baseUrl}/catalog`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`No se pudo obtener el catálogo (${response.status}).`);
  }

  const data = (await response.json()) as CatalogResponse;
  return data.items;
}

export async function getOrders(
  instance: IPublicClientApplication,
  account: AccountInfo
): Promise<Order[]> {
  const accessToken = await getAccessToken(instance, account);

  const response = await fetch(`${apiConfig.baseUrl}/orders`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`No se pudieron obtener los pedidos (${response.status}).`);
  }

  const data = (await response.json()) as OrdersResponse;
  return data.items;
}