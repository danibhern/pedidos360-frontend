import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = "Pedidos360Orders";
const CATALOG_TABLE = "Pedidos360Catalog";

const ALLOWED_TRANSITIONS = {
  CREADO: ["ACEPTADO", "CANCELADO"],
  ACEPTADO: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["DESPACHADO", "CANCELADO"],
  DESPACHADO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: []
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  };
}

function getRoles(rawRoles) {
  if (Array.isArray(rawRoles)) {
    return rawRoles
      .filter((role) => typeof role === "string")
      .map((role) => role.trim().toLowerCase());
  }

  if (typeof rawRoles !== "string") {
    return [];
  }

  const value = rawRoles.trim();

  if (!value) {
    return [];
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    const contents = value.slice(1, -1).trim();

    if (!contents) {
      return [];
    }

    return contents
      .split(",")
      .map((role) =>
        role
          .trim()
          .replace(/^["']|["']$/g, "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
  }

  return [value.toLowerCase()];
}

export const handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims;

  if (!claims) {
    return jsonResponse(401, {
      message: "Se requiere autenticación."
    });
  }

  const roles = getRoles(claims.roles);

  const canManageOrders =
    roles.includes("admin") ||
    roles.includes("operator") ||
    roles.includes("operador");

  if (!canManageOrders) {
    return jsonResponse(403, {
      message: "No tienes permiso para cambiar estados."
    });
  }

  const orderId = String(
    event.pathParameters?.id ??
      event.pathParameters?.orderId ??
      ""
  ).trim();

  if (!orderId) {
    return jsonResponse(400, {
      message: "Debe indicar el identificador del pedido."
    });
  }

  let body;

  try {
    body = JSON.parse(event.body ?? "");
  } catch {
    return jsonResponse(400, {
      message: "El cuerpo de la solicitud debe ser JSON válido."
    });
  }

  const nextStatus =
    typeof body?.status === "string"
      ? body.status.trim().toUpperCase()
      : "";

  if (
    !nextStatus ||
    !Object.prototype.hasOwnProperty.call(
      ALLOWED_TRANSITIONS,
      nextStatus
    )
  ) {
    return jsonResponse(400, {
      message: "El estado solicitado no es válido."
    });
  }

  try {
    const orderResult = await docClient.send(
      new GetCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId },
        ConsistentRead: true
      })
    );

    const order = orderResult.Item;

    if (!order) {
      return jsonResponse(404, {
        message: "El pedido no existe."
      });
    }

    const currentStatus = order.status;
    const allowedNext =
      ALLOWED_TRANSITIONS[currentStatus] ?? [];

    if (!allowedNext.includes(nextStatus)) {
      return jsonResponse(409, {
        message:
          `No se permite pasar de ${currentStatus} a ${nextStatus}.`
      });
    }

    const mustChangeStock =
      nextStatus === "ACEPTADO" ||
      (nextStatus === "CANCELADO" &&
        currentStatus !== "CREADO");

    if (
      mustChangeStock &&
      (
        !Array.isArray(order.items) ||
        order.items.length === 0 ||
        order.items.length > 20 ||
        order.items.some(
          (item) =>
            typeof item?.productId !== "string" ||
            !item.productId.trim() ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0
        ) ||
        new Set(
          order.items.map((item) => item.productId)
        ).size !== order.items.length
      )
    ) {
      return jsonResponse(409, {
        message:
          "El pedido tiene productos inválidos y no se puede modificar su stock."
      });
    }

    const now = new Date().toISOString();

    const transactItems = [
      {
        Update: {
          TableName: ORDERS_TABLE,
          Key: { orderId },
          UpdateExpression:
            "SET #status = :nextStatus, updatedAt = :updatedAt",
          ConditionExpression:
            "attribute_exists(orderId) AND #status = :currentStatus",
          ExpressionAttributeNames: {
            "#status": "status"
          },
          ExpressionAttributeValues: {
            ":nextStatus": nextStatus,
            ":updatedAt": now,
            ":currentStatus": currentStatus
          }
        }
      }
    ];

    if (mustChangeStock) {
      for (const item of order.items) {
        const accepting = nextStatus === "ACEPTADO";

        transactItems.push({
          Update: {
            TableName: CATALOG_TABLE,
            Key: { productId: item.productId },
            UpdateExpression: accepting
              ? "SET #stock = #stock - :quantity"
              : "SET #stock = #stock + :quantity",
            ConditionExpression: accepting
              ? "attribute_exists(productId) AND #active = :active AND attribute_exists(#stock) AND #stock >= :quantity"
              : "attribute_exists(productId) AND attribute_exists(#stock)",
            ExpressionAttributeNames: {
              "#stock": "stock",
              ...(accepting
                ? { "#active": "active" }
                : {})
            },
            ExpressionAttributeValues: {
              ":quantity": item.quantity,
              ...(accepting
                ? { ":active": true }
                : {})
            }
          }
        });
      }
    }

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems
      })
    );

    const updated = await docClient.send(
      new GetCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId },
        ConsistentRead: true
      })
    );

    return jsonResponse(200, {
      message: "Estado actualizado correctamente.",
      order: updated.Item
    });
  } catch (error) {
    console.error("Error actualizando estado:", error);

    if (error?.name === "TransactionCanceledException") {
      const reasons = error.CancellationReasons ?? [];

      if (
        reasons.some(
          (reason) =>
            reason?.Code === "ConditionalCheckFailed"
        )
      ) {
        return jsonResponse(409, {
          message:
            "No se pudo cambiar el estado: el pedido cambió, un producto no está activo o no hay stock suficiente."
        });
      }
    }

    return jsonResponse(500, {
      message: "No se pudo actualizar el estado del pedido."
    });
  }
};