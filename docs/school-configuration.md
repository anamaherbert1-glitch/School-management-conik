# Configuration établissement

Le module de configuration prépare la structure académique d'un établissement avant les admissions.

## Ordre recommandé

1. Informations de l'établissement et logo
2. Année académique
3. Semestres
4. Départements
5. Niveaux
6. Filières/programmes
7. Matières
8. Programme par filière + niveau + semestre
9. Classes/groupes
10. Salles
11. Enseignants

## Règle académique centrale

Une matière n'est pas simplement attachée à une filière : elle est planifiée dans un programme pour un niveau et un semestre précis. Cela permet à l'étudiant de voir automatiquement son parcours prévu de L1 à M2 selon le programme de sa filière.

## Sécurité

Toutes les données de configuration sont rattachées à `organization_id` et protégées par RLS afin qu'un établissement ne puisse pas accéder aux données d'un autre.
