import React from 'react';
import { useMsal } from '@azure/msal-react';
import { useRoles } from './useRoles';
import './Dashboard.css';

// Formateador de moneda CLP
const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

export type OrderStatus =
  | 'CREADO'
  | 'ACEPTADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'CANCELADO';

const STATUS_LABELS: Record<OrderStatus, { text: string; badgeClass: string }> = {
  CREADO: { text: 'Creado (Pendiente)', badgeClass: 'badge-warning' },
  ACEPTADO: { text: 'Aceptado', badgeClass: 'badge-info' },
  EN_PREPARACION: { text: 'En Preparación', badgeClass: 'badge-info' },
  DESPACHADO: { text: 'Despachado', badgeClass: 'badge-primary' },
  ENTREGADO: { text: 'Entregado', badgeClass: 'badge-success' },
  CANCELADO: { text: 'Cancelado', badgeClass: 'badge-danger' }
};

// ============================================================================
// DATOS MOCK
// ============================================================================

const ADMIN_KPIS = {
  ventasTotales: 18450000,
  pedidosTotales: 1280,
  usuariosActivos: 142,
  resumenVentasHora: [
    { hora: '09:00', ventas: 1250000, pedidos: 24 },
    { hora: '12:00', ventas: 3400000, pedidos: 68 },
    { hora: '15:00', ventas: 5100000, pedidos: 95 },
    { hora: '18:00', ventas: 8700000, pedidos: 150 }
  ]
};

const OPERATOR_DATA = {
  pedidosPendientesCount: 6,
  pedidosEnCursoCount: 12,
  colaProcesamiento: [
    { id: 'PED-9012', cliente: 'Tech Solutions SpA', items: 5, estado: 'CREADO' as OrderStatus, fecha: '2026-09-27 15:30' },
    { id: 'PED-9011', cliente: 'Empresa Alfa Ltda', items: 2, estado: 'ACEPTADO' as OrderStatus, fecha: '2026-09-27 15:10' },
    { id: 'PED-9010', cliente: 'Juan Pérez', items: 1, estado: 'EN_PREPARACION' as OrderStatus, fecha: '2026-09-27 14:45' },
    { id: 'PED-9009', cliente: 'Comercial Beta', items: 8, estado: 'CREADO' as OrderStatus, fecha: '2026-09-27 14:20' }
  ]
};

const CUSTOMER_DATA = {
  misPedidosTotales: 8,
  pedidosEnCamino: 2,
  totalInvertido: 184900,
  pedidoActivo: {
    id: 'PED-8821',
    estado: 'DESPACHADO' as OrderStatus,
    fechaCreacion: '2026-09-27 10:15',
    total: 45000,
    etapas: [
      { nombre: 'CREADO', completado: true },
      { nombre: 'ACEPTADO', completado: true },
      { nombre: 'EN_PREPARACION', completado: true },
      { nombre: 'DESPACHADO', completado: true },
      { nombre: 'ENTREGADO', completado: false }
    ]
  },
  ultimosPedidos: [
    { id: 'PED-8821', fecha: '2026-09-27', total: 45000, estado: 'DESPACHADO' as OrderStatus },
    { id: 'PED-8790', fecha: '2026-09-18', total: 89900, estado: 'ENTREGADO' as OrderStatus },
    { id: 'PED-8651', fecha: '2026-09-10', total: 50000, estado: 'ENTREGADO' as OrderStatus }
  ]
};

// ============================================================================
// VISTAS SEGÚN ROL
// ============================================================================

function AdminDashboardView() {
  return (
    <div className="dashboard-content">
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <span className="kpi-title">Ventas Totales</span>
          <span className="kpi-value">{clp.format(ADMIN_KPIS.ventasTotales)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Pedidos Totales</span>
          <span className="kpi-value">{ADMIN_KPIS.pedidosTotales}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Usuarios Activos (IDaaS)</span>
          <span className="kpi-value">{ADMIN_KPIS.usuariosActivos}</span>
        </div>
      </div>

      <div className="dashboard-section" style={{ marginTop: '24px' }}>
        <h3>Ventas y Pedidos por Hora</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Tramo Horario</th>
              <th>Pedidos Procesados</th>
              <th>Monto Facturado</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_KPIS.resumenVentasHora.map((row) => (
              <tr key={row.hora}>
                <td><strong>{row.hora} hrs</strong></td>
                <td>{row.pedidos} pedidos</td>
                <td>{clp.format(row.ventas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OperatorDashboardView() {
  return (
    <div className="dashboard-content">
      <div className="kpi-grid">
        <div className="kpi-card highlight-orange">
          <span className="kpi-title">Pedidos Pendientes (CREADO)</span>
          <span className="kpi-value">{OPERATOR_DATA.pedidosPendientesCount}</span>
        </div>
        <div className="kpi-card highlight">
          <span className="kpi-title">Pedidos en Curso</span>
          <span className="kpi-value">{OPERATOR_DATA.pedidosEnCursoCount}</span>
        </div>
      </div>

      <div className="dashboard-section" style={{ marginTop: '24px' }}>
        <h3>Cola de Pedidos por Procesar</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Fecha / Hora</th>
              <th>Ítems</th>
              <th>Estado Actual</th>
            </tr>
          </thead>
          <tbody>
            {OPERATOR_DATA.colaProcesamiento.map((item) => {
              const statusInfo = STATUS_LABELS[item.estado];
              return (
                <tr key={item.id}>
                  <td><strong>{item.id}</strong></td>
                  <td>{item.cliente}</td>
                  <td>{item.fecha}</td>
                  <td>{item.items} u.</td>
                  <td>
                    <span className={`badge ${statusInfo.badgeClass}`}>
                      {statusInfo.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerDashboardView() {
  const { misPedidosTotales, pedidosEnCamino, totalInvertido, pedidoActivo, ultimosPedidos } = CUSTOMER_DATA;

  return (
    <div className="dashboard-content">
      {/* Encabezado con Botón Descargar PDF */}
      <div className="dashboard-header-row">
        <h2>Mi Panel de Compras</h2>
        <button type="button" className="btn-pdf" onClick={() => alert('Generando PDF...')}>
          📄 Descargar Historial (PDF)
        </button>
      </div>

      {/* Tarjetas KPI de la Imagen */}
      <div className="kpi-grid" style={{ marginTop: '16px', marginBottom: '24px' }}>
        <div className="kpi-card">
          <span className="kpi-title">MIS PEDIDOS TOTALES</span>
          <span className="kpi-value">{misPedidosTotales}</span>
        </div>

        <div className="kpi-card border-accent">
          <span className="kpi-title">PEDIDOS EN CAMINO</span>
          <span className="kpi-value">{pedidosEnCamino}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">TOTAL INVERTIDO</span>
          <span className="kpi-value">{clp.format(totalInvertido)}</span>
        </div>
      </div>

      {/* Seguimiento de Pedido Activo */}
      <div className="dashboard-section" style={{ marginBottom: '24px' }}>
        <h3>Seguimiento de tu Pedido Activo ({pedidoActivo.id})</h3>
        <p className="subtitle" style={{ margin: '0 0 16px 0', color: '#64748b' }}>
          Fecha de solicitud: <strong>{pedidoActivo.fechaCreacion}</strong> • Total:{' '}
          <strong>{clp.format(pedidoActivo.total)}</strong>
        </p>

        <div className="stepper-container">
          {pedidoActivo.etapas.map((etapa, idx) => (
            <div
              key={etapa.nombre}
              className={`stepper-step ${etapa.completado ? 'step-completed' : ''}`}
            >
              <div className="step-number">{idx + 1}</div>
              <span className="step-label">{STATUS_LABELS[etapa.nombre as OrderStatus]?.text || etapa.nombre}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial */}
      <div className="dashboard-section">
        <h3>Historial de Tus Últimos Pedidos</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha</th>
              <th>Monto Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ultimosPedidos.map((pedido) => {
              const statusInfo = STATUS_LABELS[pedido.estado];
              return (
                <tr key={pedido.id}>
                  <td><strong>{pedido.id}</strong></td>
                  <td>{pedido.fecha}</td>
                  <td>{clp.format(pedido.total)}</td>
                  <td>
                    <span className={`badge ${statusInfo.badgeClass}`}>
                      {statusInfo.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function Dashboard() {
  const { accounts } = useMsal();
  const currentUser = accounts[0];
  const { roles, loading } = useRoles();

  const isAdmin = roles.includes('admin');
  const isOperator = roles.includes('operador');

  if (loading) {
    return <p className="loading-state">Cargando métricas de actividad…</p>;
  }

  return (
    <div className="dashboard-container">
      {/* CUADRADO SUPERIOR (BANNER DE BIENVENIDA) */}
      <div className="welcome-banner">
        <div className="welcome-avatar">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'O'}
        </div>
        <div className="welcome-info">
          <h3>¡Bienvenido/a, {currentUser?.name || 'Operador'}!</h3>
          <p>
            {currentUser?.username || 'Operador@CloudPedidos.onmicrosoft.com'} • Rol activo:{' '}
            <span className="role-highlight">
              {isAdmin ? 'Administrador' : isOperator ? 'Operador' : 'Cliente'}
            </span>
          </p>
        </div>
      </div>

      {/* Renderizado según Rol */}
      {isAdmin ? (
        <AdminDashboardView />
      ) : isOperator ? (
        <OperatorDashboardView />
      ) : (
        <CustomerDashboardView />
      )}
    </div>
  );
}

export default Dashboard;