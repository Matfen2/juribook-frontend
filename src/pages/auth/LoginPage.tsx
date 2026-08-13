import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { saveUser } = useAuth();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Met à jour le champ modifié et efface l'erreur précédente
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await login(form);
      saveUser(data.token, data.role);
      if (data.role === 'ADMIN')  return navigate('/admin/dashboard');
      if (data.role === 'LAWYER') return navigate('/lawyer/dashboard');
      navigate('/client/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ── Colonne gauche — branding ── */}
      <motion.div
        className="hidden lg:flex w-[44%] bg-blue-700 flex-col p-10 relative overflow-hidden"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-white/4" />

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center">
            <i className="ti ti-scale text-white text-lg" aria-hidden="true" />
          </div>
          <div>
            <p className="text-white font-semibold text-base tracking-tight">JuriBook</p>
            <p className="text-blue-300 text-xs">Le Doctolib des avocats</p>
          </div>
        </div>

        {/* Contenu central */}
        <div className="mt-14 z-10">
          <h1 className="text-white text-2xl font-semibold leading-snug tracking-tight mb-3">
            Trouvez l'avocat qu'il vous faut, quand vous en avez besoin.
          </h1>
          <p className="text-blue-300 text-sm leading-relaxed mb-8">
            Recherchez par spécialité et ville, consultez les disponibilités et réservez en quelques clics.
          </p>

          {/* Features avec icônes */}
          {[
            { icon: 'ti-search',   text: 'Recherche par spécialité et ville' },
            { icon: 'ti-calendar', text: 'Réservation en ligne 24h/24' },
            { icon: 'ti-bell',     text: 'Rappels automatiques par email' },
            { icon: 'ti-star',     text: 'Avis vérifiés après consultation' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                <i className={`ti ${icon} text-blue-300 text-sm`} aria-hidden="true" />
              </div>
              <p className="text-white/85 text-sm">{text}</p>
            </div>
          ))}
        </div>

        {/* Badge sécurité */}
        <div className="mt-auto z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs px-3 py-2 rounded-full">
            <i className="ti ti-shield-check text-sm" aria-hidden="true" />
            Plateforme sécurisée · Données chiffrées
          </div>
        </div>
      </motion.div>

      {/* ── Colonne droite — formulaire ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-10 w-full max-w-md"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Espace personnel
            </p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Connexion</h2>
          <p className="text-sm text-slate-500 mb-7">Accédez à votre espace JuriBook</p>

          {/* Bandeau d'erreur */}
          {error && (
            <motion.div
              className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <i className="ti ti-alert-circle text-red-500 text-base" aria-hidden="true" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Champ email */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <i className="ti ti-mail text-indigo-500 text-sm" aria-hidden="true" />
                Adresse email
              </label>
              <div className="relative">
                <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden="true" />
                <input
                  name="email"
                  type="email"
                  placeholder="jean@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Champ mot de passe */}
            <div className="mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <i className="ti ti-lock text-indigo-500 text-sm" aria-hidden="true" />
                Mot de passe
              </label>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden="true" />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="text-right mb-6">
              <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <i className="ti ti-arrow-right text-base" aria-hidden="true" />
                </>
              )}
            </motion.button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <p className="text-xs text-slate-400">Pas encore de compte ?</p>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Cards d'inscription */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/register"
              className="border-[1.5px] border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl p-3 flex flex-col items-center gap-1 transition group"
            >
              <i className="ti ti-user text-xl text-blue-600" aria-hidden="true" />
              <p className="text-xs font-semibold text-slate-700">Créer un compte</p>
              <p className="text-[11px] text-slate-400">Réserver un RDV</p>
            </Link>
            <Link
              to="/register/lawyer"
              className="border-[1.5px] border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl p-3 flex flex-col items-center gap-1 transition group"
            >
              <i className="ti ti-briefcase text-xl text-blue-600" aria-hidden="true" />
              <p className="text-xs font-semibold text-slate-700">Mon cabinet</p>
              <p className="text-[11px] text-slate-400">Gérer mes RDV</p>
            </Link>
          </div>

          {/* Barre de confiance */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <i className="ti ti-lock text-slate-300 text-xs" aria-hidden="true" />
            <span className="text-[11px] text-slate-400">Connexion sécurisée SSL</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[11px] text-slate-400">RGPD</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[11px] text-slate-400">Données chiffrées</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;