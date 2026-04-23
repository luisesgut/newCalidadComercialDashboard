export default function KPICard({ label, value, sub, trend, trendUp, color, icon: Icon, accent }) {
  return (
    <div className="card" style={{ padding: '12px 14px', position: 'relative', overflow: 'hidden', borderTop: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ marginTop: 4, color: color || '#252423' }}>{value}</div>
          {sub && <div className="kpi-sub">{sub}</div>}
          {trend !== undefined && (
            <div style={{ marginTop: 5 }}>
              <span className={trendUp ? 'trend-up' : 'trend-down'}>
                {trendUp ? '▲' : '▼'} {trend}%
              </span>
              <span style={{ fontSize: 10, color: '#A19F9D', marginLeft: 4 }}>vs mes ant.</span>
            </div>
          )}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 4, background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Icon && <Icon size={16} color={accent} />}
        </div>
      </div>
    </div>
  );
}
