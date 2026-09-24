import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useRoles } from "./useRoles";
import {
  getCatalog,
  type CatalogProduct
} from "./api/catalogApi";
import "./Catalog.css";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

// ---------------------------------------------------------------------------
// SUBCOMPONENTE 1: ProductCardComponent
// ---------------------------------------------------------------------------
interface ProductCardProps {
  product: CatalogProduct;
  viewMode: "grid" | "list";
  canManage: boolean;
  onEdit: (product: CatalogProduct) => void;
  onReduceStock: (productId: string) => void;
}

export function ProductCardComponent({
  product,
  viewMode,
  canManage,
  onEdit,
  onReduceStock
}: ProductCardProps) {
  let stockClass = "badge-available";
  let stockText = `Stock: ${product.stock} u.`;

  if (product.stock === 0) {
    stockClass = "badge-out";
    stockText = "Agotado";
  } else if (product.stock <= 5) {
    stockClass = "badge-critical";
    stockText = `Stock Crítico (${product.stock})`;
  }

  return (
    <article className={`product-card ${viewMode === "list" ? "card-list-mode" : ""}`}>
      <div>
        <div className="product-card-header">
          <h3>{product.name}</h3>
          <span className={`stock-badge ${stockClass}`}>{stockText}</span>
        </div>

        <p className="product-description">{product.description}</p>
        <p className="product-price">{clp.format(product.price)}</p>
      </div>

      {canManage && (
        <div className="card-actions" style={{ display: "flex", gap: "8px", width: "100%", marginTop: "12px" }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={() => onEdit(product)}
          >
            ✏️ Editar
          </button>

          <button
            type="button"
            className="btn-warning"
            style={{ flex: 1 }}
            disabled={product.stock <= 0}
            onClick={() => onReduceStock(product.productId)}
            title="Reducir stock local"
          >
            📉 -1 Stock
          </button>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTE 2: ProductFormComponent
// ---------------------------------------------------------------------------
interface ProductFormProps {
  initialProduct?: CatalogProduct | null;
  onSave: (productData: Partial<CatalogProduct>) => void;
  onCancel: () => void;
}

export function ProductFormComponent({
  initialProduct,
  onSave,
  onCancel
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [price, setPrice] = useState<number | "">(initialProduct?.price ?? "");
  const [stock, setStock] = useState<number | "">(initialProduct?.stock ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      productId: initialProduct?.productId,
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      active: true
    });
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h2>{initialProduct ? "Editar Producto" : "Nuevo Producto"}</h2>

      <div className="form-group">
        <label htmlFor="prod-name">Nombre del Producto</label>
        <input
          id="prod-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="prod-desc">Descripción</label>
        <textarea
          id="prod-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="prod-price">Precio (CLP)</label>
          <input
            id="prod-price"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="prod-stock">Stock Disponible</label>
          <input
            id="prod-stock"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {initialProduct ? "Guardar Cambios" : "Crear Producto"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL: Catalog
// ---------------------------------------------------------------------------
export function Catalog() {
  const { instance, accounts } = useMsal();
  const { roles, loading: rolesLoading } = useRoles();
  const isAdmin = roles.includes("admin");
  const isOperator = roles.includes("operador");
  const canManage = isAdmin || isOperator;

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal / Formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  // Carga conectada a API Gateway / Lambda
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

  // Guardar producto en formulario local
  const handleSaveProduct = (productData: Partial<CatalogProduct>) => {
    setProducts((prev) => {
      if (productData.productId) {
        return prev.map((p) =>
          p.productId === productData.productId ? ({ ...p, ...productData } as CatalogProduct) : p
        );
      } else {
        const newProduct = {
          ...productData,
          productId: `PROD-${Date.now().toString().slice(-3)}`
        } as CatalogProduct;
        return [...prev, newProduct];
      }
    });
    setIsFormOpen(false);
  };

  const handleReduceStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId && p.stock > 0 ? { ...p, stock: p.stock - 1 } : p))
    );
  };

  if (loading || rolesLoading) {
    return <p className="loading-state">Cargando catálogo…</p>;
  }

  if (error && products.length === 0) {
    return <p role="alert" className="alert-error">{error}</p>;
  }

  return (
    <section className="catalog-container">
      <div className="catalog-header">
        <div>
          <h1>Catálogo de Productos</h1>
          <p>Gestión de inventario Pedidos360.</p>
        </div>

        <div className="catalog-controls">
          {canManage && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
            >
              ➕ Crear Producto
            </button>
          )}

          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              田 Grid
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              ☰ Lista
            </button>
          </div>
        </div>
      </div>

      {error && <p role="alert" className="alert-error" style={{ color: "#e11d48", marginBottom: "12px" }}>{error}</p>}

      {isFormOpen && (
        <div className="form-modal-backdrop">
          <ProductFormComponent
            initialProduct={editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      )}

      <div className={viewMode === "grid" ? "catalog-grid" : "catalog-list"}>
        {products.map((product) => (
          <ProductCardComponent
            key={product.productId}
            product={product}
            viewMode={viewMode}
            canManage={canManage}
            onEdit={(prod) => {
              setEditingProduct(prod);
              setIsFormOpen(true);
            }}
            onReduceStock={handleReduceStock}
          />
        ))}
      </div>
    </section>
  );
}

export default Catalog;