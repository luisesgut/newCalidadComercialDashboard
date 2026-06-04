import { createContext, useContext, useState } from 'react';

const DashboardFilterContext = createContext();

export function DashboardFilterProvider({ children }) {
  const [filtros, setFiltros] = useState({
    operador: null,
    turno: null,
    familiaDefecto: null,
  });

  const toggleFiltro = (tipo, valor) =>
    setFiltros((prev) => ({
      ...prev,
      [tipo]: prev[tipo] === valor ? null : valor,
    }));

  const limpiarFiltros = () =>
    setFiltros({ operador: null, turno: null, familiaDefecto: null });

  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <DashboardFilterContext.Provider value={{ filtros, toggleFiltro, limpiarFiltros, hayFiltros }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export const useDashboardFilter = () => useContext(DashboardFilterContext);
