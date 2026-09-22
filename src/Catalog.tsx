import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import {
  createOrder,
  getCatalog,
  type CatalogProduct,
  type CreateOrderItem
} from "./api/catalogApi";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

type CartItem = CatalogProduct & {
  quantity: number;
};

export function Catalog() {
  const { instance, accounts } = useMsal();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      const account = accounts[0];

      if (!account) {
        setError("No hay una sesión activa.");
        setLoading(false);
        return;
      }

      try {
        const items = await getCatalog(instance, account);

        // Solo se muestran productos habilitados.
        setProducts(items.filter((product) => product.active));
      } catch (err) {
        console.error(err);
        setError(
          "No se pudo cargar el catálogo. Verifica sesión, token y conexión con la API."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, [accounts, instance]);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cart]);

  const addToCart = (product: CatalogProduct) => {
    setError("");
    setSuccessMessage("");

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.productId === product.productId
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          setError(`No puedes agregar más unidades de ${product.name}.`);
          return currentCart;
        }

        return currentCart.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find((item) => item.productId === productId);

    if (!product) {
      return;
    }

    setError("");
    setSuccessMessage("");

    if (quantity <= 0) {
      setCart((currentCart) =>
        currentCart.filter((item) => item.productId !== productId)
      );
      return;
    }

    if (quantity > product.stock) {
      setError(`El stock máximo disponible para ${product.name} es ${product.stock}.`);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const submitOrder = async () => {
    const account = accounts[0];

    if (!account) {
      setError("No hay una sesión activa.");
      return;
    }

    if (cart.length === 0) {
      setError("Agrega al menos un producto antes de crear el pedido.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setCreatingOrder(true);

    const items: CreateOrderItem[] = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    try {
      const order = await createOrder(instance, account, { items });

      setCart([]);
      setSuccessMessage(
        `Pedido creado correctamente. Número: ${order.orderId.slice(0, 8)}`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el pedido."
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return <p>Cargando catálogo…</p>;
  }

  if (error && products.length === 0) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h1>Catálogo</h1>
      <p>Productos disponibles de Pedidos360.</p>

      {error && <p role="alert">{error}</p>}

      {successMessage && <p role="status">{successMessage}</p>}

      <div className="catalog-layout">
        <div className="catalog-grid">
          {products.map((product) => (
            <article className="product-card" key={product.productId}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p>{clp.format(product.price)}</p>
              <p>Stock disponible: {product.stock}</p>

              <button
                type="button"
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? "Sin stock" : "Agregar"}
              </button>
            </article>
          ))}
        </div>

        <aside className="cart-panel">
          <h2>Carrito</h2>

          {cart.length === 0 ? (
            <p>Tu carrito está vacío.</p>
          ) : (
            <>
              <ul className="cart-list">
                {cart.map((item) => (
                  <li className="cart-item" key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{clp.format(item.price)} por unidad</p>
                    </div>

                    <div className="cart-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        aria-label={`Quitar una unidad de ${item.name}`}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        aria-label={`Agregar una unidad de ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="cart-total">
                Total estimado: {clp.format(cartTotal)}
              </p>

              <button
                type="button"
                onClick={submitOrder}
                disabled={creatingOrder}
              >
                {creatingOrder ? "Creando pedido…" : "Crear pedido"}
              </button>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}