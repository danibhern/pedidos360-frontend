import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { getOrders, type Order } from "./api/catalogApi";

const statusLabel: Record<string, string> = {
  CREADO: "Creado",
  ACEPTADO: "Aceptado",
  EN_PREPARACION: "En preparación",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado"
};

export function Orders() {
  const { instance, accounts } = useMsal();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      const account = accounts[0];

      if (!account) {
        setError("No hay una sesión activa.");
        setLoading(false);
        return;
      }

      try {
        const items = await getOrders(instance, account);
        setOrders(items);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los pedidos.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [accounts, instance]);

  if (loading) {
    return <p>Cargando pedidos…</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h1>Mis pedidos</h1>
      <p>Consulta el estado de tus pedidos realizados en Pedidos360.</p>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>Aún no tienes pedidos registrados.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.orderId}>
              <div className="order-card-header">
                <div>
                  <span className="order-id">
                    Pedido #{order.orderId.slice(0, 8)}
                  </span>

                  <p>
                    Creado:{" "}
                    {new Intl.DateTimeFormat("es-CL", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(order.createdAt))}
                  </p>
                </div>

                <span
                  className={`status-badge status-${order.status.toLowerCase()}`}
                >
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>

              <div className="order-items">
                <strong>Productos</strong>

                <ul>
                  {order.items.map((item) => (
                    <li key={`${order.orderId}-${item.productId}`}>
                      {item.productId} · Cantidad: {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}