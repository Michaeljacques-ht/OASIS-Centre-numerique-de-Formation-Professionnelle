# Importer une évaluation HTML déjà préparée

Dans l’étape Contenu, chaque module propose « Importer une évaluation HTML interactive ». La section Évaluation finale propose le même import, avec titre et poids dans la note finale.

Importez un fichier .html autonome (5 Mo maximum) avec CSS, scripts et médias intégrés. Les dossiers annexes et ZIP ne sont pas importés. Les chemins locaux vers des fichiers voisins doivent être remplacés par des contenus intégrés ou des URL HTTPS accessibles.

## Transmettre la note

Dans le code de votre activité, après calcul du résultat, ajoutez :

```js
if (window.OASIS) {
  OASIS.submit(score, total);
}
```

Exemple : `OASIS.submit(8, 10)` enregistre 80 %. Le total doit être strictement positif et le score compris entre 0 et le total. OASIS fournit cette fonction automatiquement lors de l’affichage. L’activité peut aussi émettre `parent.postMessage({type: 'oasis:result', score: 8, total: 10}, '*')`.

Un fichier HTML qui ne transmet pas de score s’affiche, mais son résultat ne peut pas être enregistré ou valider le module. Les fichiers HTML arbitraires n’ont pas tous le même format de résultat : cette ligne doit être placée à l’endroit où votre activité calcule sa note.

L’exemple `exemples/evaluation-interactive.html` est prêt à importer. La note est enregistrée sans saisie manuelle, le meilleur score est conservé, le seuil du barème s’applique, le module suivant est débloqué après réussite et les résultats sont inclus dans le bilan, le relevé et la certification.

Les fichiers sont exécutés dans une iframe isolée, sans accès aux cookies ni aux données de la page principale. Les activités reposant sur le stockage navigateur de même origine doivent être adaptées.
