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

// ============================================================================
// DATOS FICTICIOS (MOCK DATA)
// ============================================================================
const MOCK_CLIENT_DATA = {
  totalPedidos: 8,
  pedidosEnCamino: 2,
  totalGastado: 184900,
  ultimosPedidos: [
    { id: 'PED-8821', fecha: '2026-09-22', total: 45000, estado: 'En camino' },
    { id: 'PED-8790', fecha: '2026-09-18', total: 89900, estado: 'Entregado' },
    { id: 'PED-8651', fecha: '2026-09-10', total: 50000, estado: 'Entregado' }
  ]
};

const MOCK_OPERATOR_DATA = {
  pendientesDespacho: 14,
  stockCriticoCount: 3,
  procesadosHoy: 28,
  colaDespacho: [
    { id: 'PED-8825', cliente: 'Empresa Alfa SpA', items: 5, prioridad: 'Alta' },
    { id: 'PED-8824', cliente: 'Juan Pérez', items: 2, prioridad: 'Normal' },
    { id: 'PED-8823', cliente: 'Tech Solutions', items: 12, prioridad: 'Alta' }
  ]
};

const MOCK_ADMIN_DATA = {
  ventasMes: 18450000,
  usuariosActivos: 142,
  pedidosTotales: 1280,
  eficienciaOperativa: '98.4%',
  resumenMensual: [
    { mes: 'Junio', ventas: 12000000, pedidos: 890 },
    { mes: 'Julio', ventas: 15200000, pedidos: 1050 },
    { mes: 'Agosto', ventas: 18450000, pedidos: 1280 }
  ]
};

// ============================================================================
// VISTAS SEGÚN ROL
// ============================================================================
function ClientDashboard() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-banner">
        <h2>Mi Panel de Compras</h2>
        <button className="btn-primary" onClick={() => alert('Descargando reporte PDF…')}>
          📄 Descargar Historial (PDF)
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Mis Pedidos Totales</span>
          <span className="kpi-value">{MOCK_CLIENT_DATA.totalPedidos}</span>
        </div>
        <div className="kpi-card highlight">
          <span className="kpi-title">Pedidos en Camino</span>
          <span className="kpi-value">{MOCK_CLIENT_DATA.pedidosEnCamino}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Total Invertido</span>
          <span className="kpi-value">{clp.format(MOCK_CLIENT_DATA.totalGastado)}</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Estado de Mis Últimos Pedidos</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CLIENT_DATA.ultimosPedidos.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.id}</strong></td>
                <td>{p.fecha}</td>
                <td>{clp.format(p.total)}</td>
                <td>
                  <span className={`badge ${p.estado === 'En camino' ? 'badge-warning' : 'badge-success'}`}>
                    {p.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OperatorDashboard() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-banner">
        <h2>Centro de Control Operativo</h2>
        <button className="btn-primary" onClick={() => alert('Exportando datos a CSV…')}>
          📊 Exportar Hoja de Ruta (CSV)
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card highlight-orange">
          <span className="kpi-title">Pendientes de Despacho</span>
          <span className="kpi-value">{MOCK_OPERATOR_DATA.pendientesDespacho}</span>
        </div>
        <div className="kpi-card highlight-red">
          <span className="kpi-title">Alertas Stock Crítico</span>
          <span className="kpi-value">{MOCK_OPERATOR_DATA.stockCriticoCount}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Procesados Hoy</span>
          <span className="kpi-value">{MOCK_OPERATOR_DATA.procesadosHoy}</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Cola Prioritaria de Despacho</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Cant. Ítems</th>
              <th>Prioridad</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_OPERATOR_DATA.colaDespacho.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.id}</strong></td>
                <td>{p.cliente}</td>
                <td>{p.items} u.</td>
                <td>
                  <span className={`badge ${p.prioridad === 'Alta' ? 'badge-danger' : 'badge-info'}`}>
                    {p.prioridad}
                  </span>
                </td>
                <td>
                  <button className="btn-secondary-sm" onClick={() => alert(`Preparando pedido ${p.id}`)}>
                    Preparar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-banner">
        <h2>Panel de Control General (Admin)</h2>
        <button className="btn-primary" onClick={() => alert('Generando reporte Excel…')}>
          📈 Reporte Consolidado (Excel)
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Ventas del Mes</span>
          <span className="kpi-value">{clp.format(MOCK_ADMIN_DATA.ventasMes)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Usuarios Activos</span>
          <span className="kpi-value">{MOCK_ADMIN_DATA.usuariosActivos}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Pedidos Totales</span>
          <span className="kpi-value">{MOCK_ADMIN_DATA.pedidosTotales}</span>
        </div>
        <div className="kpi-card highlight">
          <span className="kpi-title">SLA Operaciones</span>
          <span className="kpi-value">{MOCK_ADMIN_DATA.eficienciaOperativa}</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Rendimiento Trimestral de Ventas</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Total Pedidos</th>
              <th>Ingresos Totales</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ADMIN_DATA.resumenMensual.map((r) => (
              <tr key={r.mes}>
                <td><strong>{r.mes}</strong></td>
                <td>{r.pedidos}</td>
                <td>{clp.format(r.ventas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL PROTEGIDO
// ============================================================================
export function Dashboard() {
  const { accounts } = useMsal();
  const currentUser = accounts[0];
  const { roles, loading } = useRoles();

  const isAdmin = roles.includes('admin');
  const isOperator = roles.includes('operador');

  if (loading) {
    return <p className="loading-state">Cargando métricas del dashboard…</p>;
  }

  return (
    <div className="dashboard-container">
      {/* Tarjeta Superior de Bienvenida con datos Entra ID */}
      <header className="welcome-card">
        <div className="avatar">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="welcome-info">
          <h2>¡Bienvenido/a, {currentUser?.name || 'Usuario'}!</h2>
          <p className="subtitle">
            {currentUser?.username} • Rol activo:{' '}
            <strong>{isAdmin ? 'Administrador' : isOperator ? 'Operador' : 'Cliente'}</strong>
          </p>
        </div>
      </header>

      {/* Renderizado condicional del dashboard según el perfil */}
      {isAdmin ? (
        <AdminDashboard />
      ) : isOperator ? (
        <OperatorDashboard />
      ) : (
        <ClientDashboard />
      )}
    </div>
  );
}

export default Dashboard;