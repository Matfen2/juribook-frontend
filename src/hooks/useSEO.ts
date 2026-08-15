// src/hooks/useSEO.ts
// Hook pour gérer les meta tags dynamiquement par page
// Utilise react-helmet-async (npm install react-helmet-async)
import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  noIndex?: boolean
  ogImage?: string
  ogType?: 'website' | 'profile' | 'article'
}

const BASE_URL = 'https://juribook.fr'
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`
const SITE_NAME = 'JuriBook'

export function useSEO({
  title,
  description,
  canonical,
  noIndex = false,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
}: SEOProps = {}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Trouvez un avocat, réservez en ligne`
  const fullDescription = description ?? 'Recherchez un avocat par spécialité et ville, consultez ses disponibilités et réservez un rendez-vous en quelques clics.'
  const fullCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Meta description
    setMeta('name', 'description', fullDescription)

    // Robots
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    // Canonical
    setLink('canonical', fullCanonical)

    // Open Graph
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', fullDescription)
    setMeta('property', 'og:url', fullCanonical)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:type', ogType)

    // Twitter
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', fullDescription)
    setMeta('name', 'twitter:image', ogImage)
  }, [fullTitle, fullDescription, fullCanonical, noIndex, ogImage, ogType])
}

function setMeta(attr: string, key: string, value: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}