# Contributing to 3D Multi-View Platform

Merci de votre intérêt pour contribuer à la plateforme 3D Multi-View ! Ce guide vous aidera à démarrer.

## 🚀 Démarrage rapide

1. **Fork le repository**
   ```bash
   # Créez un fork sur GitHub, puis clonez-le
   git clone https://github.com/votre-username/3d-multiview-platform.git
   cd 3d-multiview-platform
   ```

2. **Installation des dépendances**
   ```bash
   npm install
   ```

3. **Lancement en mode développement**
   ```bash
   npm run dev
   ```

4. **Ouvrez votre navigateur**
   ```
   http://localhost:3000
   ```

## 📁 Structure du projet

```
3d-multiview-platform/
├── src/
│   ├── core/           # Composants 3D principaux
│   ├── ui/             # Interface utilisateur
│   ├── export/         # Système d'export
│   ├── loaders/        # Chargeurs de modèles
│   └── css/            # Styles
├── public/             # Assets statiques
└── docs/               # Documentation
```

## 🛠️ Standards de développement

### Code Style

Nous utilisons ESLint et Prettier pour maintenir la cohérence du code :

```bash
# Vérification du style
npm run lint

# Formatage automatique
npm run format
```

### Règles principales :
- **JavaScript** : ES6+ modules, arrow functions, const/let
- **Nommage** : camelCase pour variables/fonctions, PascalCase pour classes
- **Commentaires** : JSDoc pour toutes les fonctions publiques
- **Imports** : Groupés et ordonnés (core, libraries, local)

### Exemple de code bien formaté :

```javascript
/**
 * Capture une vue spécifique en haute résolution
 * @param {string} viewName - Nom de la vue (front, back, etc.)
 * @param {Object} options - Options d'export
 * @returns {Promise<Object>} Données de l'image capturée
 */
async captureView(viewName, options = {}) {
  if (!this.isValidView(viewName)) {
    throw new Error(`Vue invalide: ${viewName}`);
  }
  
  const exportOptions = this.prepareExportOptions(options);
  return await this.processCapture(viewName, exportOptions);
}
```

## 🎯 Types de contributions

### 🐛 Correction de bugs

1. **Vérifiez** si le bug n'est pas déjà signalé dans les Issues
2. **Créez une issue** avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs observé
   - Captures d'écran si pertinent
   - Informations système (OS, navigateur, etc.)

### ✨ Nouvelles fonctionnalités

1. **Discutez** de votre idée dans une issue avant de commencer
2. **Assurez-vous** que la fonctionnalité s'aligne avec les objectifs du projet
3. **Écrivez** des tests si applicable
4. **Documentez** la nouvelle fonctionnalité

### 📚 Documentation

- Améliorations du README
- Guides d'utilisation
- Commentaires de code
- Exemples d'usage

### 🔧 Améliorations techniques

- Performance
- Accessibilité
- Compatibilité navigateurs
- Architecture du code

## 📝 Processus de Pull Request

### 1. Préparation

```bash
# Créez une branche pour votre fonctionnalité
git checkout -b feature/nom-de-votre-fonctionnalite

# Ou pour un bugfix
git checkout -b fix/description-du-bug
```

### 2. Développement

- **Commits atomiques** : un commit = une fonctionnalité/correction
- **Messages clairs** : utilisez le format conventionnel
  ```
  feat: ajouter export TurboSquid haute résolution
  fix: corriger le crash lors du chargement GLB
  docs: mettre à jour le guide d'installation
  style: formater les fichiers CSS
  refactor: simplifier la gestion des caméras
  test: ajouter tests pour ImageExporter
  ```

### 3. Tests

```bash
# Vérifiez que tout fonctionne
npm run dev

# Testez les exports
npm run build

# Vérifiez le code
npm run lint
```

### 4. Soumission

1. **Push** votre branche
   ```bash
   git push origin feature/nom-de-votre-fonctionnalite
   ```

2. **Créez une Pull Request** sur GitHub avec :
   - **Titre** : Description claire et concise
   - **Description** : 
     - Qu'est-ce qui change ?
     - Pourquoi ce changement ?
     - Comment tester ?
     - Captures d'écran si pertinent
   - **Liens** : Références aux issues concernées

### 5. Review

- Soyez réactif aux commentaires
- Poussez les corrections sur la même branche
- La PR sera mergée après approbation

## 🧪 Tests

### Tests manuels essentiels :

1. **Chargement de modèles**
   - Testez avec différents formats (.glb, .gltf)
   - Vérifiez les modèles avec/sans textures
   - Testez des modèles de tailles variées

2. **Navigation**
   - Rotation, zoom, pan dans chaque viewport
   - Raccourcis clavier
   - Responsive design

3. **Export**
   - Tous les formats (PNG, JPEG)
   - Différentes résolutions
   - Templates marketplace

4. **Performance**
   - Modèles complexes (>1M polygones)
   - Multiple exports simultanés
   - Utilisation mémoire

### Tests automatisés (futur)

Nous prévoyons d'ajouter :
- Tests unitaires (Jest)
- Tests d'intégration (Cypress)
- Tests de performance

## 🐛 Signalement de bugs

### Template d'issue :

```markdown
**Description du bug**
Une description claire et concise du problème.

**Étapes pour reproduire**
1. Allez sur '...'
2. Cliquez sur '...'
3. Faites défiler jusqu'à '...'
4. Voyez l'erreur

**Comportement attendu**
Description claire de ce qui devrait se passer.

**Captures d'écran**
Si applicable, ajoutez des captures d'écran.

**Environnement**
- OS: [ex. Windows 10, macOS 12]
- Navigateur: [ex. Chrome 96, Firefox 95]
- Version du projet: [ex. v1.2.0]
- Modèle 3D testé: [si pertinent]

**Informations supplémentaires**
Tout autre contexte utile pour le problème.
```

## 💡 Suggestions de fonctionnalités

### Template d'issue :

```markdown
**La fonctionnalité est-elle liée à un problème ?**
Une description claire du problème. Ex: Je suis frustré quand [...]

**Solution souhaitée**
Description claire de ce que vous voulez qui arrive.

**Alternatives considérées**
Description d'autres solutions ou fonctionnalités que vous avez considérées.

**Contexte supplémentaire**
Tout autre contexte ou captures d'écran sur la demande de fonctionnalité.
```

## 🎨 Guidelines UI/UX

### Principes de design :
- **Simplicité** : Interface claire et intuitive
- **Performance** : Feedback visuel immédiat
- **Accessibilité** : Support clavier, contrastes
- **Responsive** : Fonctionnel sur desktop et tablet

### Couleurs principales :
- Primary: `#6366f1` (Indigo)
- Success: `#10b981` (Emerald)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Background: `#f8fafc` (Slate 50)

## 📞 Obtenir de l'aide

- **Issues GitHub** : Pour bugs et suggestions
- **Discussions** : Pour questions générales
- **Email** : Pour problèmes sensibles

## 🏆 Reconnaissance

Tous les contributeurs seront ajoutés à la section "Contributors" du README. Les contributions significatives peuvent être mises en avant dans les release notes.

## 📄 Licence

En contribuant, vous acceptez que vos contributions soient sous la même licence MIT que le projet.

---

**Merci de contribuer à rendre la plateforme 3D Multi-View encore meilleure ! 🚀**
