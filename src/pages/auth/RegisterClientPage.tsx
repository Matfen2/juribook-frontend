import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerClient } from '../../api/authApi';

// Constantes déclarées hors composant, suite à la review d'Abdelhadi (mentor) :
// ces tableaux ne changent jamais, les recréer à chaque render est un gaspillage
// inutile (nouvelle référence d'objet à chaque rendu, alloue de la mémoire pour rien).
const FIELDS = [
  { name: 'name',     label: 'Nom complet',  optionnel: false, icon: 'ti-user',  type: 'text',     placeholder: 'Jean Dupont'          },
  { name: 'email',    label: 'Adresse email', optionnel: false, icon: 'ti-mail',  type: 'email',    placeholder: 'jean@example.com'     },
  { name: 'password', label: 'Mot de passe',  optionnel: false, icon: 'ti-lock',  type: 'password', placeholder: 'Minimum 8 caractères' },
  { name: 'phone',    label: 'Téléphone',     optionnel: true,  icon: 'ti-phone', type: 'text',     placeholder: '0612345678'           },
] as const;

const STEPS = [
  { num: 1, done: true,  active: false, title: 'Informations personnelles', sub: 'Nom, email, mot de passe, téléphone'    },
  { num: 2, done: false, active: true,  title: 'Validation email',          sub: 'Confirmation par lien envoyé par email' },
  { num: 3, done: false, active: false, title: 'Accès à JuriBook',          sub: 'Recherchez et réservez votre avocat'    },
] as const;

const RegisterClientPage = () => {
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await registerClient(form);
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50">

      {/* ── Colonne gauche ── */}
      <motion.div
        className="hidden lg:flex w-[36%] bg-blue-700 flex-col p-10 relative overflow-hidden h-full"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-white/4" />

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center">
            <i className="ti ti-scale text-white text-2xl" aria-hidden="true" />
          </div>
          <div>
            <p className="text-white font-semibold text-xl tracking-tight">JuriBook</p>
            <p className="text-blue-300 text-md">Le Doctolib des avocats</p>
          </div>
        </div>

        {/* Contenu central - flex-1 pour occuper tout l'espace */}
        <div className="mt-12 z-10 flex-1 flex flex-col">
          <h1 className="text-white text-xl font-semibold leading-snug tracking-tight mb-2">
            Créez votre compte en quelques étapes
          </h1>
          <p className="text-blue-300 text-sm leading-relaxed mb-8">
            Rejoignez des milliers de clients qui trouvent leur avocat sur JuriBook.
          </p>

          {/* Stepper */}
          <div className="flex flex-col">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                    ${step.done
                      ? 'bg-emerald-500 border border-emerald-400 text-white'
                      : step.active
                        ? 'bg-blue-500 border border-blue-400 text-white'
                        : 'bg-white/10 border border-white/25 text-white/60'
                    }
                  `}>
                    {step.done
                      ? <i className="ti ti-check text-xs" aria-hidden="true" />
                      : step.num
                    }
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-white/15 my-1" />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-semibold mb-0.5 ${step.done || step.active ? 'text-white' : 'text-white/50'}`}>
                    {step.title}
                  </p>
                  <p className={`text-xs leading-relaxed ${step.done || step.active ? 'text-blue-300' : 'text-white/35'}`}>
                    {step.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Badge sécurité : poussé en bas */}
          <div className="mt-auto pt-8">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs px-3 py-2 rounded-full">
              <i className="ti ti-shield-check text-sm" aria-hidden="true" />
              Plateforme sécurisée · Données chiffrées
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Colonne droite : formulaire ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto">
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-10 w-full max-w-md"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Retour */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-6 transition"
          >
            <i className="ti ti-arrow-left text-sm" aria-hidden="true" />
            Retour à la connexion
          </Link>

          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Nouveau compte
            </p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Créer un compte</h2>
          <p className="text-sm text-slate-500 mb-7">Rejoignez JuriBook pour réserver vos consultations</p>

          {/* Bandeau erreur */}
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

          {/* Bandeau succès */}
          {success && (
            <motion.div
              className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <i className="ti ti-circle-check text-emerald-500 text-base" aria-hidden="true" />
              <p className="text-sm text-emerald-700">{success} — Redirection en cours...</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {FIELDS.map(({ name, label, optionnel, icon, type, placeholder }) => (
              <div key={name} className="mb-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                  <i className={`ti ${icon} text-indigo-500 text-sm`} aria-hidden="true" />
                  {label}
                  {optionnel && (
                    <span className="text-slate-400 font-normal">(optionnel)</span>
                  )}
                </label>
                <div className="relative">
                  <i className={`ti ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm`} aria-hidden="true" />
                  <input
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            ))}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true" />
                  Création...
                </>
              ) : (
                <>
                  Créer mon compte
                  <i className="ti ti-arrow-right text-base" aria-hidden="true" />
                </>
              )}
            </motion.button>
          </form>

          {/* Lien login */}
          <p className="text-center text-xs text-slate-400 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>

          {/* Barre de confiance */}
          <div className="flex items-center justify-center gap-2 mt-4">
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

export default RegisterClientPage;