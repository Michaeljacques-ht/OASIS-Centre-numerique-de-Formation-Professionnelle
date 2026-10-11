# Portrait de graduation

La page Documents officiels propose une carte photo aux utilisateurs connectés : aperçu, accord de transmission, transformation IA avec toge, coiffe et diplôme en main, puis téléchargement PNG privé.

## Activation sur Render

Dans Environment, ajouter OPENAI_API_KEY avec une clé API OpenAI disposant de crédits et de l’accès au modèle gpt-image-1.5. La facturation API est distincte de ChatGPT et de Brevo. Ne jamais placer cette clé dans le navigateur, Git ou le ZIP. Redéployer après la configuration.

Option : GRADUATION_DAILY_LIMIT (3 tentatives par utilisateur et jour par défaut, maximum 20). Les tentatives échouées comptent également afin de limiter les appels répétés. Une seule création simultanée par utilisateur dans un processus serveur.

Node 20 ou supérieur. Le serveur doit pouvoir joindre https://api.openai.com/v1/images/edits. Prévoir au moins cinq minutes de délai de requête sur tout proxy utilisé.

La photo originale n’est pas conservée sur disque par Oasis ; elle est transmise à OpenAI après l’accord de l’utilisateur. Le dernier portrait généré est conservé dans DATA_DIR/portraits-prives et remplace le précédent. Utiliser le disque persistant pour DATA_DIR. Chaque utilisateur ne peut consulter et télécharger que son propre portrait, après connexion. Les portraits ne sont jamais servis comme fichiers publics.

La fidélité du visage est demandée avec input_fidelity=high, sans garantie absolue : l’apprenant peut examiner le résultat puis refaire un portrait. Choisir une photo nette, seul, avec le visage et le buste visibles. Le souvenir généré n’a aucune valeur de diplôme.

Référence API : https://developers.openai.com/api/reference/resources/images/methods/edit
