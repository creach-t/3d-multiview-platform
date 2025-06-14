/**
 * main.js - MODIFIÉ pour intégrer ExportPreviewIntegration
 * Ajout de l'export preview dans l'initialisation
 */

// Vos imports existants...

// AJOUT: Import du système export preview
import { ExportPreviewIntegration } from './ui/ExportPreviewIntegration.js';

// Dans votre classe principale ou fonction d'initialisation
class MultiviewApp {
  constructor() {
    // ... votre code existant ...
  }

  async init() {
    // ... votre initialisation existante ...
    
    // APRÈS l'initialisation de renderer, cameraManager, imageExporter
    
    // AJOUT: Initialiser l'export preview
    this.exportPreview = new ExportPreviewIntegration(
      this,           // app
      this.cameraManager,
      this.imageExporter
    );
    
    console.log('✅ Export Preview Integration loaded');
  }

  // AJOUT: Méthode pour render all views (si pas déjà présente)
  renderAllViews() {
    if (this.renderer && this.cameraManager && this.scene) {
      ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach(viewName => {
        const camera = this.cameraManager.getCamera(viewName);
        if (camera) {
          this.renderer.renderSingle(viewName, this.scene, camera);
        }
      });
    }
  }
}

// Si vous n'avez pas de classe, ajoutez après vos initialisations :
/*
// Exemple d'intégration simple
const exportPreview = new ExportPreviewIntegration(
  window.app || null,  // votre instance app
  cameraManager,       // votre instance cameraManager
  imageExporter        // votre instance imageExporter  
);

// Exposer globalement pour tests
window.exportPreview = exportPreview;
*/
