# Export Preview Mode - Vue/Export Synchronization

## Problème résolu

Les vues adaptatives ne correspondaient pas aux exports avec ratios fixes, causant des décalages entre ce qui était visible et ce qui était exporté.

## Solution

Mode "Export Preview" qui synchronise parfaitement les vues avec les paramètres d'export.

## Utilisation

### Intégration rapide

```javascript
// Dans votre main.js
import { ExportPreviewIntegration } from './src/ui/ExportPreviewIntegration.js';

// Après initialisation de app, cameraManager, imageExporter
const exportPreview = new ExportPreviewIntegration(
  app, 
  cameraManager, 
  imageExporter
);
```

### Contrôles automatiques

- **Bouton toggle** (coin bas-droit) : Active/désactive le mode
- **Sélecteur de preset** (au-dessus du bouton) : Choisit le format d'export
- **Indicateurs visuels** : Bordures vertes/oranges sur les viewports
- **Panneau d'info** (coin haut-droit) : Informations du mode actuel

### Utilisation programmatique

```javascript
// Activer manuellement
exportPreview.enableExportPreview('turbosquid_product');

// Exporter une vue (correspond exactement à ce qui est affiché)
await exportPreview.exportView('front');

// Exporter toutes les vues
await exportPreview.exportAllViews();

// Désactiver
exportPreview.disableExportPreview();
```

## Presets disponibles

- `turbosquid_search` : 1920×1920 (1:1)
- `turbosquid_product` : 1920×1080 (16:9)
- `cgtrader_main` : 1920×1440 (4:3)
- `square` : 2048×2048 (1:1)
- `ultra_hd` : 3840×2160 (16:9)
- `print_ready` : 7680×4320 (16:9)

## Modifications apportées

### CameraManager.js
- ✅ Mode Export Preview
- ✅ Synchronisation aspect ratios
- ✅ Presets marketplace
- ✅ Méthodes de contrôle

### ImageExporter.js
- ✅ Synchronisation viewport
- ✅ Capture avec preview exact
- ✅ Détection correspondance vue/export
- ✅ API de statut

### ExportPreviewIntegration.js (nouveau)
- ✅ Interface utilisateur complète
- ✅ Indicateurs visuels
- ✅ Contrôles automatiques
- ✅ Export simplifié

## États visuels

- **Bordure verte** : Vue correspond exactement à l'export
- **Bordure orange** : Vue sera croppée lors de l'export
- **Badge "EXPORT ✓"** : Correspondance parfaite
- **Badge "CROP"** : Différence détectée

## Avantages

1. **WYSIWYG** : Ce que vous voyez = ce que vous exportez
2. **Cohérence** : Ratios d'aspect guarantis
3. **Simplicité** : Toggle on/off instantané
4. **Feedback visuel** : Indicateurs en temps réel
5. **Compatibilité** : Tous les presets marketplace

## Test

1. Chargez un modèle 3D
2. Activez Export Preview (bouton bas-droit)
3. Changez la taille de la fenêtre → les vues gardent le ratio d'export
4. Exportez une vue → correspond exactement à ce qui est affiché
5. Désactivez → retour aux vues adaptatives

Le problème de désynchronisation vue/export est maintenant résolu. ✅
