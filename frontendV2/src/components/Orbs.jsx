const orbBase = {
  position: 'absolute',
  borderRadius: '50%',
}

export default function Orbs() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}
    >
      <div style={{ ...orbBase, width: 700, height: 700, top: '-180px', left: '-180px', background: 'var(--orb-primary)', filter: 'blur(90px)' }} className="orb" />
      <div style={{ ...orbBase, width: 560, height: 560, bottom: '-140px', right: '-140px', background: 'var(--orb-secondary)', filter: 'blur(80px)' }} className="orb" />
      <div style={{ ...orbBase, width: 380, height: 380, top: '30%', left: '60%', transform: 'translate(-50%,-50%)', background: 'var(--orb-accent)', filter: 'blur(100px)' }} className="orb" />
    </div>
  )
}
