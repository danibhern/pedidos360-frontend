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

export type CreateOrderItem = {
  productId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  items: CreateOrderItem[];
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
    throw new Error(
      `No se pudieron obtener los pedidos (${response.status}).`
    );
  }

  const data = (await response.json()) as OrdersResponse;
  return data.items;
}

export async function createOrder(
  instance: IPublicClientApplication,
  account: AccountInfo,
  payload: CreateOrderPayload
): Promise<Order> {
  const accessToken = await getAccessToken(instance, account);

  const response = await fetch(`${apiConfig.baseUrl}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const rawResponse = await response.text();

  if (!response.ok) {
    throw new Error(
      `No se pudo crear el pedido (${response.status}): ${rawResponse}`
    );
  }

  let data: unknown;

  try {
    data = JSON.parse(rawResponse);
  } catch {
    throw new Error(
      `La API respondió correctamente, pero no devolvió JSON válido: ${rawResponse}`
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("order" in data) ||
    typeof data.order !== "object" ||
    data.order === null ||
    !("orderId" in data.order) ||
    typeof data.order.orderId !== "string"
  ) {
    throw new Error(
      `La API creó el pedido, pero la respuesta no tiene el formato esperado: ${rawResponse}`
    );
  }

  return data.order as Order;
}