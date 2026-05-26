import { Clock3, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { MAINTENANCE_MESSAGE } from '../middleware/maintenanceMode';

export default function MaintenanceScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF6FF 45%, #F7F3FF 100%)',
      padding: 28,
      overflow: 'hidden',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
    }}>
      <section style={{
        width: 'min(100%, 680px)',
        background: '#FFFFFF',
        border: '1px solid rgba(0, 120, 212, 0.14)',
        borderRadius: 14,
        padding: '34px 34px 30px',
        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.16)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: 'linear-gradient(90deg, #0078D4, #00B7C3, #8B5CF6)',
          borderRadius: '14px 14px 0 0',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 14,
            background: '#E5F1FB',
            color: '#0078D4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Wrench size={29} />
          </div>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              color: '#0078D4',
              background: '#EFF6FC',
              border: '1px solid #DDECF8',
              borderRadius: 999,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}>
              <ShieldCheck size={13} />
              Acceso temporalmente pausado
            </div>
            <h1 style={{ margin: 0, color: '#252423', fontSize: 32, lineHeight: 1.12, fontWeight: 850 }}>
              Estamos afinando el dashboard
            </h1>
            <p style={{ margin: '12px 0 0', color: '#605E5C', fontSize: 16, lineHeight: 1.65 }}>
              {MAINTENANCE_MESSAGE}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          marginTop: 28,
        }}>
          <div style={{
            border: '1px solid #EDEBE9',
            borderRadius: 10,
            padding: '14px 15px',
            background: '#FAFBFC',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#252423', fontSize: 13, fontWeight: 800 }}>
              <Sparkles size={16} color="#8B5CF6" />
              Mejoras finales
            </div>
            <div style={{ color: '#605E5C', fontSize: 12, lineHeight: 1.45, marginTop: 6 }}>
              Estamos revisando indicadores, filtros y experiencia visual.
            </div>
          </div>
          <div style={{
            border: '1px solid #EDEBE9',
            borderRadius: 10,
            padding: '14px 15px',
            background: '#FAFBFC',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#252423', fontSize: 13, fontWeight: 800 }}>
              <Clock3 size={16} color="#0078D4" />
              Vuelve pronto
            </div>
            <div style={{ color: '#605E5C', fontSize: 12, lineHeight: 1.45, marginTop: 6 }}>
              La app queda bloqueada mientras el mantenimiento esta activo.
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 24,
          paddingTop: 18,
          borderTop: '1px solid #EDEBE9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          color: '#A19F9D',
          fontSize: 11,
          fontWeight: 700,
          flexWrap: 'wrap',
        }}>
          <span>Bioflex · Calidad Comercial</span>
          <span>Modo mantenimiento</span>
        </div>
      </section>
    </div>
  );
}
