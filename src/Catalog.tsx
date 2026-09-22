import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { getCatalog, type CatalogProduct } from "./api/catalogApi";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

export function Catalog() {
  const { instance, accounts } = useMsal();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setProducts(items);
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

  if (loading) {
    return <p>Cargando catálogo…</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h1>Catálogo</h1>
      <p>Productos disponibles de Pedidos360.</p>

      <div className="catalog-grid">
        {products.map((product) => (
          <article className="product-card" key={product.productId}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>{clp.format(product.price)}</p>
            <p>Stock disponible: {product.stock}</p>
          </article>
        ))}
      </div>
    </section>
  );
}