# Courriels automatiques

Le projet envoie une confirmation de création de compte, une confirmation d’achat après paiement vérifié, ainsi qu’une confirmation d’inscription aux formations gratuites.

Dans les variables d’environnement de Render, configurez :

- `BREVO_API_KEY` : clé API Brevo.
- `MAIL_FROM` : adresse expéditrice validée dans Brevo.
- `MAIL_FROM_NAME` : nom de l’expéditeur, facultatif (OASIS par défaut).
- `BASE_URL` : URL HTTPS publique de votre site, pour les liens des courriels.

Redémarrez le service après configuration. Aucun mot de passe n’est envoyé par courriel.

Les notifications sont enregistrées dans le dossier de données persistant avec l’identifiant du compte ou de la commande. Une notification déjà enregistrée n’est pas ajoutée à nouveau lors d’un retour de paiement répété. Le serveur traite les envois toutes les 30 secondes et retente les échecs avec un délai croissant. Une panne du service de courriel ne bloque ni l’inscription ni l’achat. Sans configuration, les messages restent en attente. Les comptes et commandes antérieurs à cette mise à jour ne déclenchent pas d’envoi rétroactif.
