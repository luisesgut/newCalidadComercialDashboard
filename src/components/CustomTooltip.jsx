export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="item">
          <div className="dot" style={{ background: p.color }} />
          <span>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString('es-MX') : p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}
