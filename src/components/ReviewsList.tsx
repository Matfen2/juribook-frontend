import { useState, useEffect } from 'react'
import { getLawyerReviews, type LawyerReview } from '../api/lawyerApi'

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 1 }} aria-label={`${rating} sur 5`}>
      {'★'.repeat(rating)}
      <span style={{ color: '#E2E8F0' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(2)].map((_, i) => (
        <div key={i} style={{
          height: 64, borderRadius: 12, background: '#F1F5F9',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}

export default function ReviewsList({ lawyerId }: { lawyerId: number }) {
  const [reviews, setReviews] = useState<LawyerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    getLawyerReviews(lawyerId)
      .then(({ data }) => { if (!cancelled) setReviews(data) })
      .catch(() => { if (!cancelled) setError("Impossible de charger les avis pour l'instant.") })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [lawyerId])

  if (loading) return <Skeleton />

  if (error) {
    return <p style={{ fontSize: 13, color: '#94A3B8' }}>{error}</p>
  }

  if (reviews.length === 0) {
    return <p style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>Aucun avis pour l'instant</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {reviews.map(review => (
        <div
          key={review.id}
          data-cy="lawyer-review-item"
          style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
            padding: '12px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <StarRating rating={review.rating} />
            <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{formatDate(review.createdAt)}</span>
          </div>
          {review.comment && (
            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}