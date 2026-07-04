import { useState, useRef } from 'react'
import { uploadBookingDocument } from '../api/bookingApi'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

interface UploadedFile {
  filename: string
  status: 'uploading' | 'success' | 'error'
  errorMessage?: string
}

/**
 * Upload de documents sur une réservation.
 *
 * Pas de liste "documents déjà envoyés" récupérée du serveur, aucun
 * endpoint de consultation n'existe encore côté backend. 
 * La liste affichée ici ne couvre donc que les fichiers envoyés pendant 
 * la session en cours, pas l'historique complet si la page est rechargée.
 */
export default function DocumentUpload({ bookingId }: { bookingId: number }) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // permet de resélectionner le même fichier plus tard

    if (file.size > MAX_SIZE_BYTES) {
      setFiles(prev => [...prev, {
        filename: file.name, status: 'error',
        errorMessage: 'Fichier trop volumineux (10 Mo max)',
      }])
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFiles(prev => [...prev, {
        filename: file.name, status: 'error',
        errorMessage: 'Format non accepté (PDF, JPEG, PNG uniquement)',
      }])
      return
    }

    setFiles(prev => [...prev, { filename: file.name, status: 'uploading' }])

    try {
      await uploadBookingDocument(bookingId, file)
      setFiles(prev => prev.map(f =>
        f.filename === file.name && f.status === 'uploading' ? { ...f, status: 'success' } : f
      ))
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } }
      const message = e2.response?.data?.message || "Échec de l'envoi, réessayez."
      setFiles(prev => prev.map(f =>
        f.filename === file.name && f.status === 'uploading' ? { ...f, status: 'error', errorMessage: message } : f
      ))
    }
  }

  return (
    <div data-cy="document-upload" style={{ marginTop: 10 }}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        data-cy="document-upload-button"
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600,
          color: '#4F46E5', background: '#EEF2FF', border: '1px solid #E0E7FF',
          borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
        }}
      >
        <i className="ti ti-paperclip" style={{ fontSize: 14 }} aria-hidden />
        Joindre un document
      </button>

      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {files.map((f, i) => (
            <div
              key={i}
              data-cy="document-upload-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                padding: '6px 10px', borderRadius: 8,
                background: f.status === 'error' ? '#FEF2F2' : f.status === 'success' ? '#ECFDF5' : '#F8FAFC',
                color: f.status === 'error' ? '#B91C1C' : f.status === 'success' ? '#065F46' : '#64748B',
              }}
            >
              {f.status === 'uploading' && (
                <i className="ti ti-loader-2" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }} aria-hidden />
              )}
              {f.status === 'success' && <i className="ti ti-check" style={{ fontSize: 14 }} aria-hidden />}
              {f.status === 'error' && <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden />}

              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.filename}
              </span>

              {f.status === 'error' && f.errorMessage && (
                <span style={{ fontSize: 11, flexShrink: 0 }}>{f.errorMessage}</span>
              )}
              {f.status === 'uploading' && (
                <span style={{ fontSize: 11, flexShrink: 0 }}>Envoi...</span>
              )}
              {f.status === 'success' && (
                <span style={{ fontSize: 11, flexShrink: 0 }}>Envoyé</span>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}