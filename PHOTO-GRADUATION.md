# Portrait de graduation

L’espace apprenant (/apprenant) propose, uniquement après une formation terminée, une carte photo aux utilisateurs connectés ayant une inscription marquée completedAt. Cette condition est aussi contrôlée côté serveur pour la création et le téléchargement : aperçu, accord de transmission, transformation IA avec toge, coiffe et diplôme en main, puis téléchargement PNG privé.

## Activation sur Render

Dans Environment, ajouter OPENAI_API_KEY avec une clé API OpenAI disposant de crédits et de l’accès au modèle gpt-image-1.5. La facturation API est distincte de ChatGPT et de Brevo. Ne jamais placer cette clé dans le navigateur, Git ou le ZIP. Redéployer après la configuration.

Option : GRADUATION_DAILY_LIMIT (3 tentatives par utilisateur et jour par défaut, maximum 20). Les tentatives échouées comptent également afin de limiter les appels répétés. Une seule création simultanée par utilisateur dans un processus serveur.

Node 20 ou supérieur. Le serveur doit pouvoir joindre https://api.openai.com/v1/images/edits. Prévoir au moins cinq minutes de délai de requête sur tout proxy utilisé.

La photo originale n’est pas conservée sur disque par Oasis ; elle est transmise à OpenAI après l’accord de l’utilisateur. Une seule photo réussie par compte est autorisée, y compris pour les portraits déjà créés avant cette mise à jour. Le portrait est conservé dans DATA_DIR/portraits-prives. Les échecs peuvent être retentés dans la limite quotidienne. Utiliser le disque persistant pour DATA_DIR. Chaque utilisateur ne peut consulter et télécharger que son propre portrait, après connexion. Les portraits ne sont jamais servis comme fichiers publics.

La fidélité du visage est demandée avec input_fidelity=high, sans garantie absolue : l’apprenant peut examiner le résultat avant de confirmer la création unique. Choisir une photo nette, seul, avec le visage et le buste visibles. Le souvenir généré n’a aucune valeur de diplôme.

Référence API : https://developers.openai.com/api/reference/resources/images/methods/edit

## Personnalisation

Dans Paramètres → Photos de graduation, l’administrateur définit couleur, style, décor, message (160 caractères) et téléverse un logo (5 Mo). Les choix couleur/style de l’étudiant peuvent être autorisés ou verrouillés. Le logo OASIS est fourni par défaut comme seconde image de référence à l’IA. Le message et le logo sont reproduits par l’IA sur une feuille blanche tenue en main ; leur reproduction peut comporter des variations, ce n’est pas un assemblage typographique exact. Les changements de réglages ne modifient pas les photos existantes.

## Photos par formation
Dans Mes certificats, chaque carte propose de créer ou voir sa photo de graduation. Une seule création réussie est autorisée par étudiant et par formation terminée, avec contrôle côté serveur. Les anciennes photos restent téléchargeables via un lien dédié.
