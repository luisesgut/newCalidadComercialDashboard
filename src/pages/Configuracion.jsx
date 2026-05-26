import { Palette } from 'lucide-react';

const ACCENT_OPTIONS = [
  { value: '#0078D4', label: 'Azul Microsoft' },
  { value: '#107C10', label: 'Verde' },
  { value: '#A80000', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Púrpura' },
  { value: '#F2C812', label: 'Amarillo' },
  { value: '#00B7C3', label: 'Cian' },
];

const SIDEBAR_OPTIONS = [
  { value: '#252423', label: 'Carbón' },
  { value: '#1B1B3A', label: 'Azul noche' },
  { value: '#003366', label: 'Azul marino' },
  { value: '#1E3A2F', label: 'Verde bosque' },
];

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#252423', marginBottom: 4 }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

export default function Configuracion({ accent, onAccentChange, onSidebarChange, sidebarColor }) {
  return (
    <div className="main-scroll" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#252423' }}>Configuración</div>
        <div style={{ fontSize: 11, color: '#A19F9D' }}>Colores de la interfaz</div>
      </div>

      <div className="card" style={{ padding: '16px 20px', maxWidth: 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #F3F2F1' }}>
          <Palette size={15} color="#605E5C" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#252423' }}>Apariencia</span>
        </div>

        <Field label="Color de acento" hint="Color principal de botones, indicadores y énfasis visual">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => onAccentChange(opt.value)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: opt.value,
                  cursor: 'pointer',
                  border: accent === opt.value ? '3px solid #252423' : '3px solid transparent',
                  transition: 'border 0.1s',
                }}
              />
            ))}
          </div>
        </Field>

        <Field label="Color del sidebar" hint="Fondo de la barra lateral">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SIDEBAR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => onSidebarChange(opt.value)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: opt.value,
                  cursor: 'pointer',
                  border: sidebarColor === opt.value ? `3px solid ${accent}` : '3px solid transparent',
                  transition: 'border 0.1s',
                }}
              />
            ))}
          </div>
        </Field>

        <Field label="Vista previa">
          <div style={{ background: sidebarColor, borderRadius: 4, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: accent }} />
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Bioflex · Calidad Comercial</span>
          </div>
        </Field>
      </div>
    </div>
  );
}
