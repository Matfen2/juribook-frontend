import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const homeRoute = () => {
    if (!user) return '/login'
    if (user.role === 'ADMIN') return '/admin/dashboard'
    if (user.role === 'LAWYER') return '/lawyer/dashboard'
    return '/client/dashboard'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', overflow: 'hidden', position: 'relative',
    }}>
      {/* Cercles décoratifs animés */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, #818CF820, transparent)',
          top: '-10%', right: '-10%', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, #C4B5FD20, transparent)',
          bottom: '-5%', left: '-5%', pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 24,
          padding: '3rem 2.5rem', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(79,70,229,0.10)', position: 'relative',
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

        {/* Icône flottante */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 96, height: 96, borderRadius: 24, background: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <i className="ti ti-map-search" style={{ fontSize: 48, color: '#4F46E5' }} aria-hidden />
        </motion.div>

        {/* Code 404 */}
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ fontSize: 72, fontWeight: 800, color: '#E2E8F0', lineHeight: 1, margin: '0 0 0.5rem', letterSpacing: '-2px' }}
        >
          404
        </motion.p>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: '0 0 0.75rem' }}
        >
          Page introuvable
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ fontSize: 14, color: '#64748B', margin: '0 0 2rem', lineHeight: 1.6 }}
        >
          La page que vous cherchez n'existe pas ou a été déplacée.
          Vérifiez l'URL ou retournez à l'accueil.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10,
              border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer',
            }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 15 }} aria-hidden />
            Retour
          </motion.button>
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
            Accueil
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}