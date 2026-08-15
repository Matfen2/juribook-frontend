import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function ServerErrorPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF8E8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', overflow: 'hidden', position: 'relative',
    }}>
      {/* Cercles décoratifs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, #FDE68A20, transparent)',
          top: '-10%', right: '-10%', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{
          position: 'absolute', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, #FCD34D15, transparent)',
          bottom: '-5%', left: '-5%', pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: '#fff', border: '1px solid #FDE68A', borderRadius: 24,
          padding: '3rem 2.5rem', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(217,119,6,0.08)', position: 'relative',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '2rem' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-scale" style={{ fontSize: 19, color: '#fff' }} aria-hidden />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1E293B' }}>JuriBook</span>
        </motion.div>

        {/* Icône triangle avec pulse */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 96, height: 96, borderRadius: 24, background: '#FFFBEB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: 48, color: '#D97706' }} aria-hidden />
        </motion.div>

        {/* Code 500 */}
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ fontSize: 72, fontWeight: 800, color: '#FDE68A', lineHeight: 1, margin: '0 0 0.5rem', letterSpacing: '-2px' }}
        >
          500
        </motion.p>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: '0 0 0.75rem' }}
        >
          Erreur serveur
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ fontSize: 14, color: '#64748B', margin: '0 0 2rem', lineHeight: 1.6 }}
        >
          Une erreur inattendue s'est produite de notre côté.
          Nos équipes ont été notifiées. Réessayez dans quelques instants.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10,
              border: '1.5px solid #FDE68A', background: '#fff', color: '#D97706', cursor: 'pointer',
            }}
          >
            <i className="ti ti-refresh" style={{ fontSize: 15 }} aria-hidden />
            Réessayer
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10,
              border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', cursor: 'pointer',
            }}
          >
            <i className="ti ti-home" style={{ fontSize: 15 }} aria-hidden />
            Accueil
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}