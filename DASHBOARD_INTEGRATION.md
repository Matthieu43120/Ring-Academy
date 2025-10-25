# Guide d'intégration du nouveau tableau de bord

## Modifications effectuées

### 1. Base de données
Une nouvelle migration a été créée pour ajouter les champs d'analyse enrichie :
- `criteria_scores` (jsonb) : Scores détaillés par critère
- `recurrent_errors` (text[]) : Erreurs récurrentes
- `main_objective` (text) : Évaluation de l'objectif principal

La table `training_sessions` remplace `sessions`.

### 2. Analyse IA améliorée
Le prompt d'analyse dans `src/services/openai.ts` a été mis à jour pour fournir :
- 5 critères d'évaluation détaillés avec scores individuels
- Détection d'erreurs récurrentes
- Évaluation de l'atteinte de l'objectif (obtenir un rendez-vous)

### 3. Nouveaux composants créés

#### Composants de visualisation
- `src/components/charts/LineChart.tsx` : Graphique d'évolution
- `src/components/charts/RadarChart.tsx` : Graphique radar pour les critères
- `src/components/charts/HorizontalBarChart.tsx` : Barres horizontales

#### Composants du tableau de bord
- `src/components/dashboard/ProgressOverview.tsx` : Vue globale de progression
- `src/components/dashboard/CriteriaAnalysis.tsx` : Analyse par critère
- `src/components/dashboard/PersonalizedSummary.tsx` : Synthèse personnalisée
- `src/components/dashboard/RecurrentErrors.tsx` : Erreurs récurrentes

## Intégration dans le Dashboard

### Option 1 : Remplacer la section personnelle actuelle

Dans `src/pages/Dashboard.tsx`, remplacez la section `currentView === 'personal'` par :

```tsx
import { ProgressOverview } from '../components/dashboard/ProgressOverview';
import { CriteriaAnalysis } from '../components/dashboard/CriteriaAnalysis';
import { PersonalizedSummary } from '../components/dashboard/PersonalizedSummary';
import { RecurrentErrors } from '../components/dashboard/RecurrentErrors';

// Dans le JSX, section personnelle :
{currentView === 'personal' ? (
  <>
    {/* Crédits personnels ou organisation */}
    {/* ... garder cette section ... */}

    {/* Organisation */}
    {/* ... garder cette section ... */}

    {/* NOUVEAU : Vue globale de progression */}
    <div className="mb-8">
      <ProgressOverview sessions={sessions} />
    </div>

    {/* NOUVEAU : Analyse par critère */}
    <div className="mb-8">
      <CriteriaAnalysis sessions={sessions} />
    </div>

    {/* NOUVEAU : Synthèse personnalisée */}
    <div className="mb-8">
      <PersonalizedSummary sessions={sessions} />
    </div>

    {/* NOUVEAU : Erreurs récurrentes */}
    <div className="mb-8">
      <RecurrentErrors sessions={sessions} />
    </div>

    {/* Historique des sessions personnelles */}
    {/* ... garder cette section ... */}
  </>
) : (
  {/* Vue organisation */}
)}
```

### Option 2 : Ajouter un onglet supplémentaire

Ajoutez un troisième onglet "Progression détaillée" qui affiche uniquement les nouveaux composants analytiques.

## Structure des données attendues

Les composants attendent des sessions avec la structure suivante :

```typescript
interface SessionData {
  id: string;
  score: number;
  created_at: string;
  difficulty: string;
  criteria_scores: {
    accroche: number;
    ecoute: number;
    objections: number;
    clarte: number;
    conclusion: number;
  } | null;
  recurrent_errors: string[] | null;
  main_objective: string | null;
}
```

## Fonctionnalités des nouveaux composants

### ProgressOverview
- Graphique d'évolution sur les 10 dernières sessions
- Filtres par période (7j, 30j, tout)
- Filtres par difficulté
- Stats : Total sessions, Score moyen, Meilleur score

### CriteriaAnalysis
- Vue radar ou barres horizontales
- Moyenne des 5 dernières sessions
- Guide d'interprétation des scores

### PersonalizedSummary
- "Pense-bête" avec le critère le plus faible
- Message motivationnel adapté à la progression
- Point fort à cultiver
- Alerte si gestion des objections < 60

### RecurrentErrors
- Top 5 des erreurs récurrentes
- Pourcentage d'apparition
- Priorisation visuelle (rouge si > 60%)
- Conseils pratiques

## Tests recommandés

1. Testez avec aucune session
2. Testez avec 1-2 sessions (données limitées)
3. Testez avec 5+ sessions (données complètes)
4. Testez avec sessions sans criteria_scores (ancien format)
5. Testez les filtres dans ProgressOverview

## Compatibilité

Les composants sont conçus pour être compatibles avec les anciennes sessions qui n'ont pas de `criteria_scores`. Ils affichent simplement un message informatif dans ce cas.
