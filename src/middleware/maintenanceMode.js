const FORCE_MAINTENANCE_MODE = false;

export const MAINTENANCE_MODE = FORCE_MAINTENANCE_MODE || import.meta.env.VITE_MAINTENANCE_MODE === 'true';

export const MAINTENANCE_MESSAGE = 'Estamos trabajando en los ultimos detalles para que tu experiencia sea lo mejor posible.';
