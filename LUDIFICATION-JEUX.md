# Progression ludifiée et activités HTML

L’espace apprenant affiche les XP, niveaux, badges de modules validés et prochaines missions. Le calcul utilise la progression enregistrée et les résultats des évaluations, y compris les activités HTML. Une leçon ou une évaluation réussie est récompensée une fois : rejouer ne cumule pas les points.

Dans les paramètres administrateur, activer ou désactiver la ludification et définir les XP par leçon, évaluation réussie, module validé et niveau. Valeurs initiales : 50, 100, 150 et 500 XP. Modifier le barème recalcule les totaux existants. Les points ne constituent pas un registre historique de récompenses.

Les badges de progression reconnaissent les modules validés. Ils ne changent ni les notes, ni les seuils, ni les conditions d’obtention des certificats. Ils ne certifient pas une compétence pratique supplémentaire. Aucun classement public n’est ajouté.

L’espace « Jeux et simulations » regroupe les évaluations HTML déjà associées aux modules accessibles. Il peut contenir des quiz, jeux ou simulations selon les fichiers importés. Pour un apprenant, l’accès respecte les leçons terminées et l’ordre des modules ; les résultats utilisent le circuit pédagogique existant.

Les formateurs importent une activité depuis le menu d’évaluation d’un module. Le fichier autonome transmet son résultat avec OASIS.submit(score,total). Aucune simulation métier prête à l’emploi n’est fournie dans cette version. Le développement de scénarios métiers avec rétroaction pédagogique constitue une étape suivante.

Déploiement : remplacer les fichiers du projet et redéployer Render avec installation des dépendances. Les données existantes restent la source du calcul ; aucune migration manuelle n’est nécessaire.
