# OASIS — Centre Numérique de Formation Professionnelle

**Des compétences aujourd'hui pour un meilleur demain.**

Plateforme de formation en ligne qui connecte **apprenants**, **formateurs** et
**entreprises** : catalogue, achat par portefeuille mobile en gourdes, parcours
multimédia, évaluation en sept types d'épreuves et certification scellée.

**Node.js pur, zéro dépendance npm, base de données JSON** — un seul processus,
déployable sur n'importe quel hébergeur, conçu pour les connexions haïtiennes.

## Orientation métiers

La plateforme est structurée autour de l'**insertion économique**, pas du simple cours en ligne.

| Dimension | Valeurs |
|---|---|
| **Domaines** | 15 domaines métiers : numérique, création, énergie, bâtiment, automobile, froid, électronique, hôtellerie, mode, agriculture, administration, finance, commerce, métiers émergents, emploi à distance |
| **Formats** | Certificat court (1–3 mois) · Certificat professionnel (3–6 mois) · Parcours métier (6–12 mois) |
| **Modalités** | 100 % en ligne · Hybride (théorie en ligne + pratique en atelier) · Présentiel, avec **lieu de pratique** déclaré |
| **Socle transversal** | Sécurité au travail, calcul de devis, relation client, gestion d'une petite entreprise, marketing WhatsApp/Facebook, compétences numériques |
| **Épreuves** | 8 types, dont le **stage pratique en entreprise** |

Le catalogue de démonstration contient les **15 filières prioritaires** du plan de lancement
(solaire, électricité, plomberie, froid, smartphones, maintenance informatique, caméras,
mécanique, développement web, infographie, comptabilité, microfinance, cuisine, couture,
entrepreneuriat).

## Identité

| Élément | Valeur |
|---|---|
| Marine profond | `#001C4A` — titres, pastilles actives, prix |
| Bleu | `#0166C2` — liens, boutons, dégradés |
| Émeraude | `#06C994` — réussite, validation |
| Or | `#FC9F1E` — accent, badges |
| Logo | `assets/logo-oasis.png` |
| Sceau officiel | `assets/sceau-oasis.png` |
| Bannière | `assets/banniere-oasis.png` |

Toute la charte tient dans la constante `CSS` de `routes/views.js`.

## Démarrage

```bash
node server.js
# → http://localhost:3001
```

Aucune installation. Node.js ≥ 18 suffit.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Formateur (plan Pro) | `jean@oasis.ht` | `Formateur1!` |
| Formatrice (plan Starter) | `sophia@oasis.ht` | `Formateur1!` |
| Apprenante | `marie@oasis.ht` | `Apprenant1!` |
| Entreprise (Digicel Academy) | `academie@digicel.ht` | `Entreprise1!` |
| Administration | `admin@oasis.ht` | `Admin2026!` |

## Les trois espaces

### 👤 Apprenants (étudiants, enseignants, professionnels)
- Catalogue avec recherche et filtre par catégorie (9 catégories)
- Fiche formation : programme détaillé, avis, formateur, prix en gourdes,
  **boutons de partage social** (WhatsApp, Facebook, X, LinkedIn, copier le lien)
- **Achat en HTG** via la passerelle PLOP PLOP (MonCash / NatCash / Kashpaw)
- Lecteur de cours : leçons, **ressources téléchargeables** (PDF, images,
  vidéos lues dans le lecteur avec streaming Range, audio), progression enregistrée
- **Quiz par module** et **évaluation finale**, reprises illimitées (meilleur score conservé)
- **Note globale pondérée** : quiz × poids quiz + examen × poids examen (barème configurable : poids, seuil, mélange aléatoire des questions) — elle conditionne le certificat
- **Grille de compétences** par module et **grille d’évaluation comptabilisée** (page « Compétences & notes »)
- **Forum de discussion** par formation (badge Formateur, réservé aux inscrits) et **annonces du formateur** dans le lecteur
- **Certificat de réussite imprimable**, délivré uniquement quand toutes les
  leçons sont terminées **et** l'évaluation finale réussie (si elle existe)

### 🎓 Formateurs
- Tableau de bord : revenus, solde, étudiants, formations populaires, ventes récentes
- **Profil public de formateur** (/formateurs/:id) éditable : photo, titre, bio, expertises, stats, avis
- **Carnet de notes** par formation : apprenants × évaluations, note globale, statut
- **Assistant de création en 3 étapes** avec **image de couverture** téléversable
  (JPG/PNG/WebP, aperçu en direct) — visible sur les cartes et fiches
- Par module : leçons, **ressources téléversées** (PDF 20 Mo, images 5 Mo,
  vidéos MP4/WebM 80 Mo, audio MP3) et **quiz** (QCM 2 à 4 réponses)
- **Évaluation finale** de la formation, éditable question par question
- Publication contrôlée, archivage, modification
- **Revenus : 85 % du prix de vente** (commission 15 %), abonnés, avis
- **Retraits mobiles réels** : le formateur choisit MonCash ou NatCash et saisit son
  numéro (mémorisé), Oasis exécute le retrait marchand PLOP PLOP en
  3 étapes (authentification → jeton signé HMAC-SHA256 → versement) ; le solde
  n'est débité que si la passerelle confirme, et la référence est archivée
- **Plans d'abonnement** en gourdes, limite du plan Gratuit appliquée

### 🏢 Entreprises (Oasis Entreprise)
- Académie dédiée : vue d'ensemble, taux de complétion, formations les plus suivies
- Invitation de collaborateurs un par un **ou création de comptes en lot**
  (une ligne par employé : `Nom complet, email` — lignes invalides et doublons
  signalés), afin de créer d'abord tous les comptes puis d'assigner les formations
- **Assignation de formations** obligatoires ou optionnelles, à tous ou individuellement
- Rapports de progression détaillés par collaborateur et par formation

## 🏛️ Gestion de l'institution

Trois modules réservés à l'administration (`/gestion`), chacun construit selon
les règles de sa discipline, et reliés entre eux.

### Scolarité — `/gestion/etudiants`

Dossier administratif à **matricule pérenne** (`OAS-2026-0001`), distinct du compte
apprenant auquel il peut être relié. Inscriptions par période, **échéancier** de 1 à
24 versements (le dernier absorbe l'arrondi, la somme retombe au centime sur le
total), encaissements partiels **imputés sur les échéances les plus anciennes**,
reçus numérotés, refus de tout encaissement supérieur au solde dû.
`/gestion/recouvrement` classe les impayés échus par ancienneté.

### Ressources humaines — `/gestion/rh`

Dossiers du personnel, contrats, historique salarial, congés et boni.
La **paie suit le droit haïtien** :

| Cotisation | Salarié | Employeur |
|---|---|---|
| ONA (assurance vieillesse) | 6 % | 6 % |
| OFATMA maladie-maternité | — | 3 % |
| OFATMA accidents du travail | — | 2 % commerce et services |
| Impôt sur le revenu | barème progressif retenu à la source | — |

Barème d'imposition par tranches annuelles : 0 % jusqu'à 120 000 HTG, puis 10 %,
15 %, 25 % et 30 % au-delà de 1 000 000 HTG. L'impôt est calculé sur la base
annualisée puis ramené au mois.

> ⚠️ **À faire vérifier avant la première paie réelle.** Ces taux et seuils sont ceux
> couramment appliqués, mais ils évoluent par voie légale. Faites-les confirmer auprès
> de l'**ONA**, de l'**OFATMA** et de la **DGI** — en particulier la périodicité du
> barème, enregistrée ici en montants annuels. Tout est modifiable dans
> `/gestion/rh/parametres`, et **chaque bulletin conserve une copie des paramètres
> utilisés** : changer un taux ne modifie jamais un bulletin déjà émis.

Le taux accidents du travail dépend du secteur : 2 % commerce et services,
3 % industrie, construction et agriculture, 6 % mines.

#### Contrat de travail — `/gestion/rh/employe/:id/contrat`

Contrat rédigé depuis le dossier, puis édité en document imprimable portant le sceau
et la signature de l'institution. Il est bâti sur l'**article 22 du Code du travail**,
qui énumère les mentions obligatoires d'un contrat écrit : identité, nationalité, âge,
sexe, état civil, profession, résidence précise, carte d'identité et livret de travail,
durée et heures journalières, nature du travail, lieu d'exécution, salaire, lieu et date
de conclusion. La plateforme **vérifie ces quatorze énonciations** et refuse d'activer
un contrat incomplet, en indiquant précisément ce qui manque et où le renseigner.

Le document reprend les règles légales : durée normale de 8 h par jour et 48 h par
semaine ; congés de 15 jours consécutifs après un an (art. 123 à 129) ; boni versé entre
le 24 et le 31 décembre, au moins égal à 1/12 des salaires de l'année (art. 135 à 137) ;
barème de préavis selon l'ancienneté, obligatoire à partir de trois mois de service
consécutifs (art. 44 et 45) :

| Ancienneté | Préavis |
|---|---|
| Moins de 3 mois | aucun |
| 3 à 12 mois | 15 jours |
| 1 à 3 ans | 1 mois |
| 3 à 6 ans | 2 mois |
| 6 à 10 ans | 3 mois |
| 10 ans et plus | 4 mois |

Le préavis dû est recalculé en continu et affiché sur la fiche de l'employé. Un contrat
à terme rappelle qu'une reconduction tacite le transforme en contrat à durée indéterminée
(art. 17, 72 à 78). En l'absence de signature, l'empreinte digitale devant deux témoins
est prévue (art. 22, alinéa g).

> Le Code ne fixe **aucune période d'essai** pour l'emploi ordinaire : les trois mois
> maximum de l'article 75 (e) ne concernent que le contrat d'apprentissage. Aucune
> période d'essai n'est donc imposée par défaut.

#### Recrutement — `/gestion/rh/recrutement` et `/recrutement`

Page publique de recrutement, dont le **lien est affiché dans l'espace RH** pour être
diffusé : offres ouvertes, page détaillée par poste et formulaire de candidature avec
dépôt de CV (PDF, image ou Word). Aucun compte n'est nécessaire pour postuler, et la
candidature spontanée reste ouverte même sans offre publiée.

Côté administration : publication et retrait des offres avec référence automatique,
suivi des candidatures par étapes (reçue, présélection, entretien, retenue, non retenue)
avec notes internes horodatées, et, pour un candidat retenu, **création du dossier
employé pré-rempli** à partir de la candidature — il ne reste qu'à compléter les
énonciations de l'article 22 et à rédiger le contrat.

### Comptabilité — `/gestion/compta`

Comptabilité en **partie double**, sans compromis :

- Plan de comptes à sept classes (1 Capitaux · 2 Immobilisations · 3 Stocks ·
  4 Tiers · 5 Financier · 6 Charges · 7 Produits), extensible.
- Sept journaux : VT, AC, BQ, CA, MM (portefeuille mobile), PA (paie), OD.
- **Aucune écriture déséquilibrée n'est acceptée** : le contrôle porte sur
  l'équilibre débit/crédit, l'existence des comptes, la pièce justificative et
  l'appartenance à un exercice ouvert.
- **Une écriture validée ne se modifie ni ne s'efface** : elle se corrige par
  contre-passation, et une même écriture ne peut être extournée deux fois.
- États produits : journal, grand livre avec solde cumulé, balance générale,
  compte de résultat, bilan.
- Exercices : ouverture sans chevauchement, clôture refusée si la balance
  n'est pas équilibrée, verrouillage après clôture.
- Alerte sur tout compte de trésorerie en position créditrice — signe presque
  certain d'une erreur de saisie.

### Ce qui relie les trois

Les écritures ne sont pas saisies à la main : elles naissent de l'opération.

| Opération | Écriture générée |
|---|---|
| Inscription facturée | `411000` Étudiants **D** / `706100` Frais de scolarité **C** |
| Encaissement | `531000`/`512100`/`515000` **D** / `411000` **C** |
| Paie validée | `641000` + `645100` + `645200` **D** / `421000` net, `431000` ONA, `432000` OFATMA, `442000` IRI **C** |

### Installation vierge

Une base neuve reçoit un jeu de démonstration (4 dossiers étudiants, 4 employés avec
leur contrat, une paie validée, les charges du mois, 2 offres d'emploi et 3 candidatures).
Pour une mise en production sans données fictives : `OASIS_SANS_DEMO=1 node server.js`.

### Sources

Les règles appliquées proviennent du [Code du travail haïtien](https://oig.cepal.org/sites/default/files/2003_codtravail_hti.pdf)
et du [Guide pratique du droit du travail haïtien, Better Work Haïti](https://betterwork.org/wp-content/uploads/BWH_LLG_2017_French_Final_Book.pdf).
Les taux de cotisation restent à confirmer auprès de l'ONA, de l'OFATMA et de la DGI.

## Architecture

```
server.js                 Point d'entrée HTTP (port 3001)
lib/db.js                 Base JSON atomique + données de démo + règles métier
lib/utils.js              Crypto (scrypt), sessions, parsing (dont multipart maison)
lib/files.js              Téléversements : validation par type/taille, service avec Range
lib/plopplop.js           Client de la passerelle PLOP PLOP
routes/app.js             Routeur : public, auth, achat, quiz, fichiers, 3 espaces
routes/views.js           Gabarits publics (accueil, catalogue, fiche, tarifs…)
routes/espaces-views.js   Gabarits des espaces formateur / apprenant / entreprise
data/uploads/             Fichiers téléversés (images, PDF, vidéos, audio)
```

Sur Render, les fichiers téléversés suivent `DATA_DIR` : avec `DATA_DIR=/data`
(disque persistant), ils survivent aux redéploiements.

## Intégration PLOP PLOP (ACTIVE ✅)

Passerelle : `plopplop.solutionip.app` — documentation `/paiement-doc`.
Méthodes acceptées : MonCash, NatCash, Kashpaw.

### Achat d'une formation (2 appels)

```
[Apprenant] « Payer »
  → POST api/paiement-marchand { client_id, refference_id: ord_…, montant, payment_method }
  → la page de paiement PLOP PLOP s'ouvre ; l'apprenant confirme sur son portefeuille
  → POST api/paiement-verify   { client_id, refference_id }   (sondage toutes les 5 s)
  → trans_status = "ok"  →  inscription + crédit formateur 85 % (idempotent)
```

La passerelle ne rappelle pas le marchand : la confirmation se fait par
**vérification côté serveur**, sans aucune confiance accordée au navigateur.
Montant minimum imposé par l'API : **20 HTG**.

### Retrait des revenus du formateur (3 étapes + HMAC)

```
1. POST api/auth/marchand                  { client_id, client_secret }        → token
2. POST api/auth/marchand/withdrawal-token { amount, method, recipient,
      reference: WD-…, timestamp, withdrawal_signature }  (Bearer token)       → withdrawal_token
      signature = HMAC-SHA256(secret, "montant|methode|destinataire|reference|timestamp")
3. POST api/withdraw/marchand              { amount, method, recipient, reference }
      (Bearer withdrawal_token)  → { success, data: { status, transaction_id, fee, balance_after } }
```

Vérification d'un retrait : `POST api/withdraw/marchand/verify { reference }`.
Les références `WD-AAAAMMJJ-XXXXXX` sont uniques (l'API refuse les doublons).

### Configuration

⚠️ Ne jamais écrire les clés dans le code.

```powershell
$env:PLOP_CLIENT_ID="pp_..."; $env:PLOP_CLIENT_SECRET="..."
node server.js
```

Sans ces variables, la plateforme fonctionne normalement mais les achats payants
et les retraits affichent « Passerelle non configurée » (les formations gratuites
restent accessibles).

### Tester sans les vraies clés

```bash
node outils/simulateur-plop.js          # simulateur PLOP PLOP : https://localhost:4443

NODE_TLS_REJECT_UNAUTHORIZED=0 PLOP_HOTE=localhost:4443 \
PLOP_CLIENT_ID=pp_test PLOP_CLIENT_SECRET=secret_test node server.js
```

Le simulateur reproduit les réponses des six routes (paiement, vérification,
authentification marchand, jeton signé, retrait, vérification de retrait),
**contrôle réellement la signature HMAC** et refuse les références en double.
Pour simuler le paiement de l'apprenant :
`POST https://localhost:4443/simuler-paiement { "refference_id": "ord_…" }`.

## Déploiement sur Render

1. Pousser ce dossier sur GitHub → nouveau *Web Service*, start : `node server.js`.
2. Attacher un *Persistent Disk* monté sur `/data` et définir `DATA_DIR=/data`.

## Feuille de route

- Téléversement réel de vidéos/images (actuellement : contenu texte et liens)
- Facturation groupée entreprise (les assignations sont notées « facturation fin de mois »)
- Messagerie interne, sessions en direct, application PWA hors-ligne
- Outils marketing (codes promo, affiliation) esquissés dans les maquettes
- Déclarations ONA/OFATMA/DGI exportables, immobilisations et amortissements,
  lettrage des comptes de tiers

---
© Oasis Centre Numérique de Formation Professionnelle — Port-au-Prince, Haïti.

## Partage, installation et sécurité (mise à jour)

Les vignettes proposent Facebook, WhatsApp, X et la copie du lien. L’accueil propose Facebook, WhatsApp, Installer et X avant la connexion, avec une version mobile. Les fiches incluent Open Graph et Twitter Card (titre, description, image et URL). Les réseaux sociaux décident du rendu et peuvent garder un aperçu en cache ; ils ne reproduisent pas exactement la carte HTML.

Définir `BASE_URL` avec l’adresse HTTPS publique réelle, sans slash final. Les images des formations doivent être publiques. La bannière OASIS sert d’image de remplacement. L’installation utilise un manifeste et un service worker sans mise en cache des pages privées ; sur un navigateur non compatible, le bouton donne les instructions d’ajout à l’écran d’accueil.

### Réinitialisation par courriel

Configurer dans les variables d’environnement du serveur :

| Variable | Valeur |
| --- | --- |
| `BASE_URL` | Adresse HTTPS publique du site |
| `BREVO_API_KEY` | Clé API privée Brevo pour les courriels transactionnels |
| `MAIL_FROM` | Adresse d’expéditeur validée dans Brevo |

Aucune clé n’est incluse. Sans configuration, la page signale l’indisponibilité du service. Les liens expirent après 30 minutes et sont à usage unique. Changer le mot de passe ferme les sessions sans désactiver le second facteur.

### Double authentification

Cliquer sur « Activer l’authentification à deux facteurs », se connecter, scanner le QR code avec une application TOTP (Google Authenticator, Microsoft Authenticator ou équivalent), puis confirmer avec le mot de passe et un code à six chiffres. Une clé manuelle est disponible. L’activation prend effet après confirmation et ferme les sessions précédentes. Les connexions suivantes exigent un code ; les codes déjà utilisés sont refusés.

Conserver la clé manuelle en lieu sûr pour récupérer l’accès en cas de perte du téléphone. Il n’existe pas de contournement automatique du second facteur. Protéger et sauvegarder la base JSON qui contient les clés. Les limites de tentatives sont en mémoire par processus. Les informations démo sont retirées de la page de connexion uniquement ; les comptes et données existants sont conservés.

### Remplacement du projet

Remplacer le code et les ressources puis redémarrer. Conserver la base et les fichiers utilisateurs sur le disque persistant (`DATA_DIR`). Ne pas écraser la base de production avec le fichier `data/db.json` fourni dans le ZIP.


## Restauration de « Mon espace » formations

Pour les administrateurs, le bouton « Mon espace » (bureau, mobile et menu latéral) et la connexion ouvrent `/formateur`, l’espace existant de création et d’administration des formations : tableau de bord, mes formations, création, modules, leçons, ressources, quiz, évaluations et publication. Les droits administrateur existants sont conservés. L’administration générale et la gestion institutionnelle restent accessibles par les liens du menu de cet espace. Aucun compte ou cours existant n’est modifié.

## Programmes longs et diplômes techniques

Depuis **Mon espace → Programmes longs / diplômes** :

1. Choisir **Créer un programme** ou **Utiliser le modèle Bureautique EDUCA**.
2. Configurer les rubriques : identité de l’établissement, département, version, cohorte, durée, semestres, diplôme, grade, niveau de sortie, langue, modalités, admissions, public, présentation, objectifs, compétences et débouchés.
3. Compléter les méthodes, équipements, partenaires, frais, responsable et contacts.
4. Définir l’organisation par années/semestres, la répartition globale des heures et les projets intégrateurs.
5. Ajouter ou retirer les modules et renseigner leur code, année, semestre, titre, thèmes, objectifs spécifiques, prérequis, évaluations, crédits, heures théorie/pratique/stage et notes horaires.
6. Configurer le stage, le tutorat, les livrables du projet final, le jury, les évaluations pondérées, les seuils et la règle d’assiduité.
7. Enregistrer comme **Brouillon privé** ; ouvrir l’aperçu ; publier lorsque le programme est complet.
8. Depuis **Mes formations → Gérer → Programme long et diplôme technique**, associer une formation au programme. Ses objectifs, compétences, admissions, débouchés et conditions du diplôme enrichissent automatiquement sa fiche. Une association à un brouillon ne montre pas ses informations aux visiteurs.
9. Dans l’aperçu du programme, cliquer sur **Imprimer / enregistrer en PDF** puis choisir la destination PDF du navigateur.

Les formateurs approuvés créent et configurent leurs propres programmes. Les administrateurs peuvent configurer tous les programmes. Les apprenants et visiteurs consultent les programmes publiés. Le bouton Mon espace reste dirigé vers l’espace de création et de gestion des formations, et l’ancienne bannière est conservée.

### Modèle du document joint

Le modèle conserve les informations du programme EDUCA de bureautique : deux ans, quatre semestres, 19 modules, projets S1 à S4, stage de huit semaines/240 heures, PFF, répartition globale, pondération 30/40/30, seuils de 60 et 65/100 et absences maximales de 20 %. Le document source est conservé sous `docs/Programme-Bureautique-EDUCA.pdf`. Le modèle n’est ni publié ni injecté automatiquement dans la base : il faut l’enregistrer depuis l’éditeur.

**Vérification horaire nécessaire :** le tableau global annonce 960 heures, alors que les heures chiffrées des modules totalisent 970 heures, avant attribution d’un volume au PFF. Ces données sont conservées sans correction arbitraire. L’éditeur affiche l’écart et demande une confirmation explicite avant publication. La répartition globale reste un champ détaillé modifiable ; le total calculé provient des modules.

L’intitulé du diplôme est un paramètre pédagogique du programme. La rubrique reconnaissance/habilitation permet de renseigner une reconnaissance documentée. Le module ne crée pas automatiquement de diplôme pour un étudiant et ne constitue pas un système de suivi des inscriptions, des stages ou de décision de jury : il gère la conception, la présentation et la publication des programmes.

### Données et mise à jour

Les programmes sont stockés dans la collection `programmes` de la base JSON existante, ajoutée au premier usage sans remplacer les données actuelles. L’association utilise `programmeId` sur les formations. Les routes d’écriture vérifient les droits, un jeton anti-CSRF, les années/semestres, les valeurs numériques et la somme des pondérations. Les programmes acceptent jusqu’à 200 modules. Les titres, textes et modules restent modifiables après enregistrement.

Au déploiement, remplacer le code et les ressources puis redémarrer, en conservant la base et les fichiers utilisateurs sur le disque persistant `DATA_DIR`. Ne pas remplacer la base de production par `data/db.json` du ZIP.


## Paramètres pédagogiques de chaque formation

Dans **Mon espace → Mes formations → Gérer → Modifier les informations**, les champs objectifs, compétences, débouchés, équipements, logiciels, grade, intitulé du diplôme/certificat, niveau de sortie, public cible, admission, méthodes pédagogiques, évaluations et conditions de réussite sont directement modifiables. Ils existent aussi à la création d’une formation. Les rubriques vides sont masquées sur la fiche publique. Ces champs sont indépendants des programmes longs et restent enregistrés sur la formation. Vider un champ puis enregistrer le retire de la fiche publique. Aucune information du modèle Bureautique n’est appliquée automatiquement à des formations d’autres métiers.

## Dix programmes EDUCA intégrés

Au premier démarrage de cette version, dix programmes sont ajoutés comme **brouillons privés** dans **Mon espace → Programmes longs / diplômes**, sous la responsabilité du compte administrateur existant : robotique, bureautique et IA, informatique médicale, production musicale, construction et bâtiment, cinématographie, réseaux et télécommunications, revêtement de plancher, vitrage, électricité et solaire.

Les objectifs, compétences, débouchés, admissions, grade, intitulé du diplôme, modules, volumes horaires, logiciels et équipements, projets intégrateurs, stages et conditions de diplomation proviennent des PDF joints. Les quatre composantes d’évaluation et leurs intitulés sont désormais paramétrables. Lorsqu’une valeur de seuil PFF ou d’absences n’est pas précisée dans le document, elle reste vide. Les informations propres au programme et les exigences particulières sont conservées dans les champs détaillés.

Cliquer sur **Configurer** pour adapter les informations puis choisir **Publié** et enregistrer. Les volumes annoncés et les totaux chiffrés des modules sont conservés distinctement : vérifier l’écart éventuel avant publication. Les PDF originaux restent consultables avec **Document PDF source** dans l’aperçu du programme, et sont inclus dans `docs`. L’accès au PDF suit la visibilité du programme.

Chaque import possède une identité stable : redémarrer ou redéployer n’ajoute pas de doublon et ne remplace pas vos modifications. Les programmes et formations déjà enregistrés sont conservés. Une formation peut être rattachée à l’un de ces programmes depuis **Mes formations → Gérer → Programme long et diplôme technique**.

Conserver `DATA_DIR` sur le disque persistant et ne pas remplacer `data/db.json` en production. Les nouveaux imports sont ajoutés dans la base existante au démarrage, sans réinitialiser celle-ci. Les programmes restent des contenus pédagogiques configurables ; l’ajout ne délivre pas automatiquement de diplômes aux apprenants.

## Programmes longs : tableaux et pédagogie par module

La présentation des programmes utilise désormais des tableaux modernes : identité et diplôme, admissions et objectifs, organisation, stage et diplomation, puis parcours détaillé. Les tableaux restent consultables sur mobile par défilement horizontal. Les styles sont limités aux pages des programmes.

1. Dans **Mon espace → Programmes longs / diplômes**, ouvrir **Configurer** et enregistrer le programme.
2. Dans chaque module, ouvrir **Gérer les unités et la grille de compétences** (également accessible depuis l’aperçu).
3. Créer ou modifier les unités : titre, objectifs, temps estimé, texte de leçon, documents et médias, liens externes et quiz à quatre réponses. La première unité des modules existants reprend leur contenu importé ; elle reste modifiable.
4. Compléter la grille du module : code, compétence observable, critères de réussite et épreuve/preuve attendue. La trame initiale reprend le titre du module ; elle n’est pas une validation automatique des compétences du document source.
5. Dans **Apprenants et relevés**, inscrire un compte apprenant ou retrouver les apprenants inscrits à une formation associée au programme. Le programme doit être publié pour que l’apprenant puisse suivre ses unités. Les comptes se créent par les procédures existantes.
6. L’apprenant retrouve ses programmes dans **Mon espace → Mes formations**. Il termine les leçons, consulte les documents et répond aux quiz. Un quiz est réussi à partir de 60 %. Le résultat est recalculé côté serveur. Modifier le quiz oblige à le repasser.
7. Le formateur renseigne le statut de chaque compétence : non évaluée, en cours d’acquisition, acquise ou non acquise, avec une note facultative, la preuve observée et une appréciation. Les critères doivent être complétés et une preuve renseignée pour valider l’acquisition. Une modification de la compétence archive l’évaluation précédente et demande une nouvelle validation.
8. Le **relevé individuel de compétences** regroupe tous les modules, les résultats, les appréciations, le validateur et les dates, ainsi que le suivi des unités. L’apprenant consulte uniquement son relevé. L’impression permet un enregistrement en PDF ; ce document pédagogique ne remplace pas le diplôme.

Formats : PDF (20 Mo), Word DOC/DOCX, Excel XLS/XLSX, PowerPoint PPT/PPTX et OpenDocument (15 Mo), TXT (2 Mo), ZIP (25 Mo), images (5 Mo), audio MP3 (20 Mo), vidéos MP4/WebM (80 Mo). Les fichiers bureautiques se téléchargent ; les PDF s’ouvrent dans le lecteur du navigateur. Les documents de programme sont conservés dans `DATA_DIR/programme-documents`, servis par une route contrôlant l’inscription ou les droits du formateur, et ne sont pas exposés par `/fichiers`.

Conserver **tout le dossier DATA_DIR** lors du redéploiement : base JSON, uploads existants et programme-documents. Les identifiants stables des modules, unités et compétences permettent de préserver les contenus et le suivi lors d’un changement de configuration. Retirer une unité ou un module retire ses éléments du parcours actif ; les traces d’évaluations déjà enregistrées restent dans la base. Les nouvelles fonctions n’altèrent ni le lien Mon espace vers la création de formations ni l’ancienne bannière.

Validation : vérifications HTTP des dix programmes importés, de la conservation des unités pendant la configuration, de l’inscription et des accès, de la protection des fichiers PDF/DOC/DOCX, des quiz, de la protection CSRF, des grilles et relevés, et de leur sauvegarde dans la base JSON. Vérification syntaxique JavaScript. La mise en page n’a pas été vérifiée dans un navigateur graphique dans cet environnement.

## Fiche publique des programmes longs

La fiche reprend maintenant la disposition des formations classiques : couverture et titre à gauche, badge diplôme et métadonnées, partage WhatsApp/Facebook/X/LinkedIn, description enrichie, tableaux d’informations et modules, aperçu des unités. Un encadré à droite affiche les frais réels renseignés, les admissions, le responsable, le diplôme et la cohorte. Le bouton « Contacter pour s’inscrire » ouvre le formulaire de contact prérempli avec le programme concerné. Les apprenants déjà inscrits accèdent à leur parcours et à leur relevé ; l’accès aux ressources privées reste contrôlé. Aucun tarif ni achat de programme n’est créé automatiquement.

Dans Configurer → Identité et diplôme, une URL de couverture HTTP(S) ou un chemin /assets/ ou une image /fichiers/ existante peut être renseigné. Sans image, la fiche affiche un visuel dégradé avec un symbole de diplôme. Les programmes publiés fournissent des métadonnées de partage avec titre, description et image. Les brouillons n’affichent pas les actions de partage.

## Configuration guidée et listes à puces

La création et la configuration des programmes longs utilisent le même menu formateur que les formations classiques, avec trois étapes : **Informations**, **Contenu**, **Publication**, et un aperçu latéral qui se met à jour pendant la saisie. Les boutons Précédent et Continuer permettent de naviguer. Enregistrer les modifications conserve l’état de publication sélectionné ; un nouveau programme démarre en brouillon.

Les rubriques Présentation, Public cible, Admission, Objectifs, Compétences, Débouchés, Méthodes et Équipements/logiciels utilisent un éditeur de listes à puces : **Ajouter un point**, modifier son texte, déplacer vers le haut/bas, retirer. Chaque liste est enregistrée sous forme de texte canonique « • point » et affichée en véritables éléments HTML ul/li dans la fiche publique. Les listes importées regroupent les lignes de continuation d’un même point ; les paragraphes sans puce sont conservés comme éléments à affiner. Aucune information source n’est déduite ou inventée. Les champs vides restent vides. Maximum 12 000 caractères par rubrique.

Sans JavaScript, les blocs restent visibles et les listes sont éditables dans les champs texte avec un point « • » par ligne. La sauvegarde de la configuration conserve les unités et les grilles déjà attachées aux identifiants stables des modules. Validation HTTP et syntaxique réalisée pour les dix formulaires, les listes et leur persistance, l’échappement HTML et les accès. Aucun contrôle graphique dans un navigateur n’a été réalisé dans cet environnement.

## Catalogue des programmes sans imports automatiques

Les pages **Programmes longs** et **Mes programmes longs** reprennent la présentation du catalogue de formations : titre et compteur, recherche, filtres Domaine métier / Durée / Modalité et vignettes avec couverture, diplôme, durée et modules. L’espace formateur propose Créer un programme, Configurer, Aperçu et Apprenants et relevés. L’état vide propose de créer le premier programme. Le catalogue public affiche uniquement les programmes publiés.

Les programmes importés EDUCA et ceux créés à partir du modèle Bureautique sont retirés des collections actives au démarrage. Ils ne sont plus ajoutés automatiquement. Le bouton et la création depuis le modèle Bureautique sont supprimés ; un ancien lien avec `?modele=bureautique` ouvre une création vierge. Les programmes créés manuellement sans origine importée restent actifs. Les formations classiques ne sont pas supprimées.

Pour préserver les données existantes, les programmes retirés et les inscriptions correspondantes sont conservés dans les collections internes `programmesArchives` et `programmeEnrollmentsArchives`. Ils ne sont accessibles ni par le catalogue ni par leurs anciennes fiches. Les associations de formations vers ces programmes retirés sont désactivées. Conservez DATA_DIR au déploiement ; le nettoyage s’applique aussi à votre base existante, sans réinitialisation.

Validation : tests de retrait et d’absence de réimport, préservation des programmes manuels, des formations et des traces de suivi, filtres du catalogue, restriction des brouillons, état vide et création sans modèle. Syntaxe JavaScript vérifiée.

## Création des programmes longs : processus des formations

Le bouton Créer un programme ouvre désormais le formulaire existant des formations avec les mêmes champs, le même aperçu et les mêmes détails. Après enregistrement, le programme utilise la gestion habituelle : modules, leçons, documents, médias, liens, quiz, évaluations et publication. L’ancien formulaire spécifique n’est plus utilisé pour créer un programme.

Les nouveaux programmes sont des formations identifiées par `parcoursType: programme_long`, affichées aussi dans le catalogue Programmes longs. Ils utilisent les mêmes règles de droits, limites de plan, inscription, achat et progression que les formations. Les anciens programmes manuels restent conservés ; les imports restent retirés comme précédemment. Aucun dossier DATA_DIR ne doit être réinitialisé.

Validation HTTP : comparaison des champs des deux formulaires, création commune, conservation des informations pédagogiques, gestion de la formation, catalogue formateur et visibilité publique après publication.
