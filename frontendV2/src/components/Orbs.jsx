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
      <div style={{ ...orbBase, width: 'clamp(280px, 60vw, 700px)', height: 'clamp(280px, 60vw, 700px)', top: 'clamp(-72px, -15vw, -180px)', left: 'clamp(-72px, -15vw, -180px)', background: 'var(--orb-primary)', filter: 'blur(clamp(40px, 7.5vw, 90px))' }} className="orb" />
      <div style={{ ...orbBase, width: 'clamp(224px, 48vw, 560px)', height: 'clamp(224px, 48vw, 560px)', bottom: 'clamp(-56px, -12vw, -140px)', right: 'clamp(-56px, -12vw, -140px)', background: 'var(--orb-secondary)', filter: 'blur(clamp(35px, 6.5vw, 80px))' }} className="orb" />
      <div style={{ ...orbBase, width: 'clamp(152px, 33vw, 380px)', height: 'clamp(152px, 33vw, 380px)', top: '30%', left: '60%', transform: 'translate(-50%,-50%)', background: 'var(--orb-accent)', filter: 'blur(clamp(45px, 8.5vw, 100px))' }} className="orb" />
    </div>
  )
}
