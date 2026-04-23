import { useState } from 'react';
import { User, Bell, Shield, Database, Palette, Save } from 'lucide-react';

const ACCENT_OPTIONS = [
  { value: '#0078D4', label: 'Azul Microsoft' },
  { value: '#107C10', label: 'Verde' },
  { value: '#A80000', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Púrpura' },
  { value: '#F2C812', label: 'Amarillo' },
  { value: '#00B7C3', label: 'Cian' },
];

const SIDEBAR_OPTIONS = [
  { value: '#252423', label: 'Carbón (default)' },
  { value: '#1B1B3A', label: 'Azul noche' },
  { value: '#003366', label: 'Azul marino' },
  { value: '#1E3A2F', label: 'Verde bosque' },
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #F3F2F1' }}>
        <Icon size={15} color="#605E5C" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#252423' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#252423', marginBottom: 4 }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

export default function Configuracion({ accent, onAccentChange, onSidebarChange, sidebarColor }) {
  const [saved, setSaved] = useState(false);
  const [notif, setNotif] = useState({
    email: true, hallazgosCriticos: true, resumenDiario: false, cerrado: true,
  });
  const [perfil, setPerfil] = useState({
    nombre: 'Admin', email: 'admin@bioflex.mx', empresa: 'Bioflex', rol: 'Administrador',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="main-scroll" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#252423' }}>Configuración</div>
          <div style={{ fontSize: 11, color: '#A19F9D' }}>Preferencias del sistema y usuario</div>
        </div>
        <button onClick={handleSave} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 4, border: 'none',
          background: saved ? '#107C10' : accent, color: '#fff',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
        }}>
          <Save size={13} /> {saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Perfil */}
        <Section icon={User} title="Perfil de usuario">
          {[
            ['Nombre completo', 'nombre'],
            ['Correo electrónico', 'email'],
            ['Empresa', 'empresa'],
          ].map(([label, key]) => (
            <Field key={key} label={label}>
              <input
                className="pbi-input"
                value={perfil[key]}
                onChange={e => setPerfil(p => ({ ...p, [key]: e.target.value }))}
              />
            </Field>
          ))}
          <Field label="Rol">
            <select className="pbi-select" value={perfil.rol} onChange={e => setPerfil(p => ({ ...p, rol: e.target.value }))} style={{ width: '100%' }}>
              <option>Administrador</option>
              <option>Inspector</option>
              <option>Supervisor</option>
              <option>Solo lectura</option>
            </select>
          </Field>
        </Section>

        {/* Apariencia */}
        <Section icon={Palette} title="Apariencia">
          <Field label="Color de acento" hint="Color principal de la interfaz">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ACCENT_OPTIONS.map(opt => (
                <div key={opt.value} title={opt.label} onClick={() => onAccentChange(opt.value)} style={{
                  width: 28, height: 28, borderRadius: 4, background: opt.value, cursor: 'pointer',
                  border: accent === opt.value ? '3px solid #252423' : '3px solid transparent',
                  transition: 'border 0.1s',
                }} />
              ))}
            </div>
          </Field>
          <Field label="Color del sidebar" hint="Fondo de la barra lateral">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SIDEBAR_OPTIONS.map(opt => (
                <div key={opt.value} title={opt.label} onClick={() => onSidebarChange(opt.value)} style={{
                  width: 28, height: 28, borderRadius: 4, background: opt.value, cursor: 'pointer',
                  border: sidebarColor === opt.value ? '3px solid #0078D4' : '3px solid transparent',
                  transition: 'border 0.1s',
                }} />
              ))}
            </div>
          </Field>
          <Field label="Vista previa">
            <div style={{ background: sidebarColor, borderRadius: 4, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: accent }} />
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Bioflex · Calidad Comercial</span>
            </div>
          </Field>
        </Section>

        {/* Notificaciones */}
        <Section icon={Bell} title="Notificaciones">
          {[
            ['email',              'Notificaciones por email',         'Recibir alertas en el correo registrado'],
            ['hallazgosCriticos',  'Alertas de hallazgos críticos',    'Notificar inmediatamente cuando se registre un hallazgo crítico'],
            ['resumenDiario',      'Resumen diario',                   'Enviar resumen de actividad al final del día'],
            ['cerrado',            'Verificación cerrada',             'Notificar cuando una verificación cambia a Terminado'],
          ].map(([key, label, hint]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#252423' }}>{label}</div>
                <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 2 }}>{hint}</div>
              </div>
              <Toggle checked={notif[key]} onChange={v => setNotif(n => ({ ...n, [key]: v }))} />
            </div>
          ))}
        </Section>

        {/* Seguridad */}
        <Section icon={Shield} title="Seguridad">
          <Field label="Contraseña actual">
            <input className="pbi-input" type="password" placeholder="••••••••" />
          </Field>
          <Field label="Nueva contraseña">
            <input className="pbi-input" type="password" placeholder="••••••••" />
          </Field>
          <Field label="Confirmar contraseña">
            <input className="pbi-input" type="password" placeholder="••••••••" />
          </Field>
          <button style={{
            padding: '7px 14px', borderRadius: 4, border: '1px solid #EDEBE9',
            background: '#fff', color: '#252423', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4,
          }}>Cambiar contraseña</button>
        </Section>
      </div>

      {/* Data */}
      <Section icon={Database} title="Datos y exportación">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Exportar verificaciones', desc: 'CSV con todas las verificaciones del período', color: accent },
            { label: 'Exportar hallazgos',       desc: 'CSV con todos los hallazgos registrados',     color: '#A80000' },
            { label: 'Reporte ejecutivo',         desc: 'PDF con resumen ejecutivo del período',       color: '#107C10' },
          ].map(btn => (
            <div key={btn.label} style={{ border: '1px solid #EDEBE9', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#252423', marginBottom: 4 }}>{btn.label}</div>
              <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>{btn.desc}</div>
              <button style={{
                padding: '5px 12px', borderRadius: 4, border: 'none',
                background: btn.color, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Descargar</button>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ fontSize: 10, color: '#C8C6C4', textAlign: 'center', paddingBottom: 8 }}>
        Bioflex · Calidad Comercial · v2.0.0 · Todos los derechos reservados 2026
      </div>
    </div>
  );
}
