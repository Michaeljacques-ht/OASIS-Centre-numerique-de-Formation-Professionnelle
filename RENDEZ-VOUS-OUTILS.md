# Rendez-vous et outils

Dans l’espace formateur, Rendez-vous permet d’ajouter des créneaux datés associés à ses formations, de 15 à 180 minutes, avec un lieu ou un lien de visioconférence. La saisie utilise le fuseau de l’appareil ; les horaires sont conservés en UTC et affichés avec le fuseau du créneau. Les disponibilités récurrentes et synchronisations avec des calendriers externes ne sont pas incluses. Un compte administrateur utilise ici ses propres formations comme un formateur.

Les apprenants inscrits, et admis lorsque l’admission est requise, voient les créneaux de leurs formateurs. Ils indiquent le motif et soumettent une demande. Le formateur confirme ou refuse, avec une réponse facultative. La confirmation réserve le créneau et refuse les autres demandes concurrentes. Un chevauchement avec une rencontre confirmée du formateur ou de l’apprenant est bloqué. L’un ou l’autre peut annuler. Retirer un créneau annule ses demandes et rencontres, avec notification interne.

Les coordonnées de connexion à la rencontre sont visibles dans la demande confirmée. Le service n’organise pas lui-même la visioconférence : le formateur renseigne le lien qu’il possède. Les notifications sont celles de la plateforme, pas des courriels, SMS ni rappels automatiques.

Dans Outils, les raccourcis du formateur couvrent les formations, les corrections, les messages et les tâches. Ceux de l’apprenant couvrent les leçons, documents, messages et travaux. Chacun peut enregistrer ses favoris privés (100 maximum). Le formateur peut partager un lien avec les apprenants d’une de ses formations ; ces apprenants ne peuvent pas supprimer ce lien. Un outil partagé ne donne pas automatiquement accès à un abonnement externe. Les liens doivent être HTTP ou HTTPS.

Les données sont enregistrées dans le stockage persistant JSON existant. Contrôles serveur des rôles, de l’appartenance à la formation, des conflits de créneaux et du jeton CSRF. Tests simulés des demandes, confirmations, annulations, notifications et visibilité des outils.
