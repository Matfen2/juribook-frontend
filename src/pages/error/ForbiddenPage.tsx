import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const homeRoute = () => {
    if (!user) return '/login'
    if (user.role === 'ADMIN') return '/admin/dashboard'
    if (user.role === 'LAWYER') return '/lawyer/dashboard'
    return '/client/dashboard'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF8F8 0%, #FFF0F0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', overflow: 'hidden', position: 'relative',
    }}>
      {/* Cercles décoratifs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, #FCA5A520, transparent)',
          top: '-8%', right: '-8%', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'absolute', width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, #FECACA20, transparent)',
          bottom: '-5%', left: '-5%', pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: '#fff', border: '1px solid #FECACA', borderRadius: 24,
          padding: '3rem 2.5rem', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(220,38,38,0.08)', position: 'relative',
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

        {/* Icône cadenas avec animation shake */}
        <motion.div
          initial={{ rotate: -15 }}
          animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
          transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          style={{
            width: 96, height: 96, borderRadius: 24, background: '#FEF2F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <i className="ti ti-lock" style={{ fontSize: 48, color: '#DC2626' }} aria-hidden />
        </motion.div>

        {/* Code 403 */}
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ fontSize: 72, fontWeight: 800, color: '#FECACA', lineHeight: 1, margin: '0 0 0.5rem', letterSpacing: '-2px' }}
        >
          403
        </motion.p>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: '0 0 0.75rem' }}
        >
          Accès interdit
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ fontSize: 14, color: '#64748B', margin: '0 0 2rem', lineHeight: 1.6 }}
        >
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
          {user && (
            <> Vous êtes connecté en tant que <strong style={{ color: '#DC2626' }}>{user.role.toLowerCase()}</strong>.</>
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {user ? (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate(homeRoute())}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10,
                  border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', cursor: 'pointer',
                }}
              >
                <i className="ti ti-home" style={{ fontSize: 15 }} aria-hidden />
                Mon espace
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { logout(); navigate('/login') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10,
                  border: '1.5px solid #FECACA', background: '#fff', color: '#DC2626', cursor: 'pointer',
                }}
              >
                <i className="ti ti-logout" style={{ fontSize: 15 }} aria-hidden />
                Changer de compte
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10,
                border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', cursor: 'pointer',
              }}
            >
              <i className="ti ti-login" style={{ fontSize: 15 }} aria-hidden />
              Se connecter
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}