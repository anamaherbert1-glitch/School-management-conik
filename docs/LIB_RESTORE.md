# Restauration du runtime Tauri

## Contexte

Le fichier `apps/desktop/src-tauri/src/lib.rs` avait été tronqué : il ne contenait plus que l'initialisation du runtime et l'enregistrement de deux commandes. Le pont TypeScript continuait pourtant d'appeler les commandes locales pour les établissements, les années scolaires, les matières, les classes, les élèves et les inscriptions.

## Correctif proposé

La branche `fix/restore-offline-tauri-domain-commands` restaure les commandes métier historiques et ajoute les commandes nécessaires aux migrations SQLite 006 et 007.

- Migrations automatiques jusqu'à la version 7.
- Commandes locales pour établissements, administrateurs, paramètres, années scolaires, semestres, niveaux, départements, programmes, matières, classes, élèves et inscriptions.
- Vérifications côté natif des références à l'établissement et de la cohérence année scolaire/classe.
- Les noms des 30 commandes du pont TypeScript ont été comparés aux fonctions Rust et à `tauri::generate_handler!`.

## Validation restante

La correspondance des commandes a été vérifiée statiquement. La compilation Rust (`cargo check`), les tests SQLite et la création d'un paquet Windows doivent encore être exécutés avant de considérer la restauration comme validée.

## Critères de validation offline

1. Initialiser le runtime sans connexion réseau.
2. Créer et relire un établissement et un administrateur local.
3. Créer une année scolaire, des matières et une classe.
4. Créer un élève, l'inscrire à une année et l'affecter à une classe.
5. Fermer puis relancer l'application et confirmer que les données sont toujours présentes.
