# Images de partage
Les fiches publiques utilisent une image JPEG dédiée de 1200 × 630 pixels, avec la vignette entière sur fond blanc. L’URL publique ne nécessite pas de connexion. Les métadonnées précisent le format, la largeur et la hauteur. Le changement de vignette modifie l’URL de l’image. Les boutons utilisent le lien ?partage=2 pour distinguer les nouveaux partages des anciens aperçus.

Le projet utilise désormais sharp, installé par npm install. Sur Render, la commande de construction doit être npm install et le démarrage npm start (ou node server.js). Les images calculées sont mises en cache dans DATA_DIR/partage-images. Le serveur peut générer deux images simultanément.

Après déploiement, envoyer un nouveau lien ; les messages déjà envoyés peuvent conserver leur ancien aperçu. La génération locale JPEG a été testée ; le rendu sur les réseaux et l’accessibilité du site déployé restent à vérifier. Aucun changement ne peut forcer une application à afficher son aperçu si elle le désactive.
