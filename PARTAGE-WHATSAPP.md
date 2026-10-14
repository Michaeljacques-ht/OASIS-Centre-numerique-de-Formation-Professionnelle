# Partage avec aperçu de formation

Les boutons de partage utilisent une page publique légère /partager/formation/ID. Cette page prépare une image JPEG 1200 × 630 sans recadrer la vignette, puis expose le titre, une courte description et l’image dans ses métadonnées Open Graph. Le visiteur peut ouvrir la fiche complète avec « Découvrir la formation ».

Le lien est versionné à partir de la vignette, du titre et de la description. Une modification de ces informations produit un nouveau lien via les boutons du site. Seules les formations publiées sont accessibles. Aucune connexion ni exécution JavaScript n’est nécessaire pour lire l’aperçu.

Déployer les fichiers et installer les dépendances avec npm install (sharp est nécessaire). Vérifier que BASE_URL, si renseigné, correspond à l’adresse HTTPS publique actuelle. Ouvrir la formation et utiliser Partager → WhatsApp pour obtenir le nouveau lien ; les messages déjà envoyés ne sont pas modifiés.

La composition finale de la carte et le rafraîchissement de son aperçu restent contrôlés par WhatsApp. Cette mise à jour prépare les informations nécessaires mais ne peut imposer une présentation identique sur tous les appareils. Le test réel doit se faire après déploiement, en attendant que l’aperçu apparaisse avant l’envoi.
