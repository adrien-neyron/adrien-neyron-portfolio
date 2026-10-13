import { describe, it, expect } from 'vitest'
import { useDifficultyBadge } from '~/composables/useDifficultyBadge'
import { useCarnetCategory } from '~/composables/useCarnetCategory'

describe('useDifficultyBadge', () => {
  const { difficultyLabel, difficultyClass } = useDifficultyBadge()

  it('reconnaît les nouveaux libellés', () => {
    expect(difficultyLabel('Professionnel')).toBe('Professionnel')
    expect(difficultyClass('Side Project')).toBe('badge-intermediaire')
  })

  it('migre en lecture les anciens libellés déjà en base', () => {
    expect(difficultyLabel('Expert')).toBe('Professionnel')
    expect(difficultyLabel('Intermédiaire')).toBe('Side Project')
    expect(difficultyLabel('Débutant')).toBe('Apprentissage')
    expect(difficultyClass('Expert')).toBe('badge-expert')
  })

  it("renvoie undefined sans valeur et le texte brut si inconnu", () => {
    expect(difficultyLabel(undefined)).toBeUndefined()
    expect(difficultyClass(null)).toBeUndefined()
    expect(difficultyLabel('Autre')).toBe('Autre')
    expect(difficultyClass('Autre')).toBeUndefined()
  })
})

describe('useCarnetCategory', () => {
  const { categoryClass, categoryIcon } = useCarnetCategory()
  it('associe une classe à chaque catégorie et retombe sur « coulisses »', () => {
    expect(categoryClass('Trail')).toBe('badge-carnet-trail')
    expect(categoryClass('Dev')).toBe('badge-carnet-dev')
    expect(categoryClass('inconnue')).toBe('badge-carnet-coulisses')
    expect(categoryClass(undefined)).toBe('badge-carnet-coulisses')
  })
  it('fournit toujours une icône', () => {
    expect(categoryIcon('Trail')).toBeTruthy()
    expect(categoryIcon('???')).toBe(categoryIcon('Coulisses'))
  })
})
