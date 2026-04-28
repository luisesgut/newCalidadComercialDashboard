import { Construction } from 'lucide-react';

export default function Hallazgos({ accent }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: 40, textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: `${accent}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Construction size={36} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#252423', marginBottom: 6 }}>
          Módulo en construcción
        </div>
        <div style={{ fontSize: 13, color: '#A19F9D', maxWidth: 340, lineHeight: 1.6 }}>
          La sección de Hallazgos está en desarrollo. Pronto estará disponible con análisis detallado de defectos y tendencias.
        </div>
      </div>
      <div style={{
        display: 'inline-block', padding: '4px 12px', borderRadius: 20,
        background: '#FFF4CE', color: '#7A4F01', fontSize: 11, fontWeight: 600,
        border: '1px solid #F2C812',
      }}>
        Próximamente
      </div>
    </div>
  );
}
