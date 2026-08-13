/**
 * Fichier de setup Vitest - exécuté avant chaque fichier de test.
 */
import '@testing-library/jest-dom'

/**
 * Mock global de localStorage.
 *
 * jsdom dans certaines configurations ne supporte pas localStorage
 * (warning "--localstorage-file was provided without a valid path").
 * On le remplace par une implémentation en mémoire (Map) qui émule
 * le comportement réel sans dépendre du système de fichiers.
 *
 * Ce mock est disponible dans tous les tests sans import supplémentaire.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
})()
 
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})