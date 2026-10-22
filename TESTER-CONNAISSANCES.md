# Tester vos connaissances

Dans l’espace formateur (accessible à l’administrateur), importer une activité HTML5 autonome ou un paquet H5P. Configurer son titre, type (quiz, jeu, simulation), catégorie, métier, niveau numérique de 1 à 10, intitulé du niveau, consignes et publication. Répéter l’import pour proposer plusieurs niveaux d’un même jeu. Modifier les paramètres ou remplacer le fichier depuis Paramétrer. Décocher Publier pour retirer l’activité du catalogue apprenant.

Les apprenants connectés voient les activités publiées, avec filtres par catégorie, métier, niveau et type. Les niveaux indiquent la difficulté : ils n’imposent pas un verrouillage séquentiel. Les activités des modules existants restent accessibles dans une rubrique distincte et conservent leurs contrôles de progression.

HTML5 : fichier .html/.htm de 5 Mo maximum. Utiliser un fichier autonome avec médias intégrés ou accessibles en HTTPS. L’activité s’exécute dans un iframe isolé sans accès aux cookies OASIS. Le fichier peut appeler OASIS.submit(score,total) pour enregistrer le dernier résultat d’entraînement de l’apprenant. Les scores fournis par le fichier ne sont pas des preuves certificatives et ne modifient ni les notes des formations ni les certificats. Remplacer le fichier ou ses paramètres renouvelle sa révision et masque le résultat précédent.

H5P : lecteur local h5p-standalone. Les paquets sont validés, extraits dans DATA_DIR/h5p/packages et joués dans un cadre isolé. Le titre principal, content/content.json, les métadonnées de bibliothèques et les dépendances sont contrôlés. Les contenus importés doivent inclure leurs bibliothèques ou trouver leurs versions dans la réserve partagée. Le score final xAPI, lorsqu’il est émis par le contenu, est enregistré comme résultat d’entraînement. Aucun score n’est inventé pour les activités sans évaluation. Les sous-activités ne doivent pas remplacer le résultat final.

Administration → Paramètres → Lecteur H5P : activation, plein écran, cadre, crédits, taille maximale du paquet et limite de décompression. Importer un paquet contenant les bibliothèques requises dans Bibliothèques partagées ; la réserve conserve chaque version. Les versions présentes ne sont pas écrasées. Pour mettre à jour un contenu, réimporter son nouveau paquet depuis Paramétrer. La lecture reprend au début : la sauvegarde de l’état intermédiaire n’est pas intégrée.

L’URL H5P externe reste disponible pour les anciennes activités qui l’utilisaient. Réimporter leur paquet pour passer au lecteur local. Les résultats des lecteurs externes ne sont pas synchronisés. Aucun abonnement H5P.com n’est nécessaire pour le lecteur local. Cette version fournit l’import et la lecture, pas un éditeur graphique H5P : créer les fichiers avec un outil H5P puis les exporter avec leurs bibliothèques.


Après remplacement du projet, redéployer Render. Les fichiers privés se trouvent dans DATA_DIR/activites-privees ; utiliser le disque persistant habituel. Aucun jeu métier prêt à l’emploi ni éditeur graphique de jeux n’est fourni : les activités sont créées avec l’outil de votre choix puis importées.
