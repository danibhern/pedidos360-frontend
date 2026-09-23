export function Audit() {
  return (
    <section>
      <h1>Auditoría</h1>
      <p>
        Trazabilidad de acciones y cambios realizados sobre pedidos y catálogo.
      </p>

      <div className="card">
        <h2>Registro de eventos</h2>
        <p>
          Esta vista será conectada al registro de acciones del backend:
          creación de pedidos, cambios de estado y modificaciones de stock.
        </p>
      </div>
    </section>
  );
}