export type ConfigItem = { id: string; name: string; code?: string; description?: string }

export const academicSections = [
  'Établissement', 'Année académique', 'Départements', 'Niveaux', 'Filières',
  'Matières', 'Programmes', 'Classes / groupes', 'Salles', 'Enseignants',
] as const

export const demoPrograms = [
  { id: 'gc', name: 'Génie Civil', levels: [
    { name: 'L1', semesters: [
      { number: 1, subjects: ['Mathématiques', 'Physique', 'Dessin technique', 'Informatique'] },
      { number: 2, subjects: ['Mécanique', 'Topographie', 'Matériaux', 'Mathématiques'] },
    ] },
  ] },
]
