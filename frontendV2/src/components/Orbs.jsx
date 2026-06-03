export default function Orbs() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Top-left orb */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: '50%',
        top: '-180px',
        left: '-180px',
        background: 'var(--orb-primary)',
        filter: 'blur(90px)',
      }} />

      {/* Bottom-right orb */}
      <div style={{
        position: 'absolute',
        width: 560,
        height: 560,
        borderRadius: '50%',
        bottom: '-140px',
        right: '-140px',
        background: 'var(--orb-secondary)',
        filter: 'blur(80px)',
      }} />

      {/* Centre accent orb */}
      <div style={{
        position: 'absolute',
        width: 380,
        height: 380,
        borderRadius: '50%',
        top: '30%',
        left: '60%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--orb-accent)',
        filter: 'blur(100px)',
      }} />
    </div>
  )
}
