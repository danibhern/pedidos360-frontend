export function Reports() {
  return (
    <section>
      <h1>Reportes</h1>
      <p>Resumen operacional de Pedidos360.</p>

      <div className="catalog-grid">
        <article className="product-card">
          <h2>Ventas</h2>
          <p>
            Consulta del total estimado de ventas generado por los pedidos
            registrados.
          </p>
        </article>

        <article className="product-card">
          <h2>Lead time</h2>
          <p>
            Indicador del tiempo transcurrido entre la creación y la entrega de
            un pedido.
          </p>
        </article>

        <article className="product-card">
          <h2>Productos más solicitados</h2>
          <p>
            Resumen de productos ordenados según sus cantidades solicitadas.
          </p>
        </article>
      </div>
    </section>
  );
}