export default function KPICard({ label, value, sub, trend, trendUp, color, icon: Icon, accent }) {
  const activeAccent = accent || 'var(--bx-teal-700)';
  return (
    <div className="card" style={{ padding: '12px 14px', position: 'relative', overflow: 'hidden', borderTop: `3px solid ${activeAccent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ marginTop: 4, color: color || 'var(--bx-ink)' }}>{value}</div>
          {sub && <div className="kpi-sub">{sub}</div>}
          {trend !== undefined && (
            <div style={{ marginTop: 5 }}>
              <span className={trendUp ? 'trend-up' : 'trend-down'}>
                {trendUp ? '▲' : '▼'} {trend}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--bx-muted)', marginLeft: 4 }}>vs mes ant.</span>
            </div>
          )}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 6, background: `${activeAccent}1F`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Icon && <Icon size={16} color={activeAccent} />}
        </div>
      </div>
    </div>
  );
}
