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
