/**
 * ViewportRatioManager.js - Force les viewports CSS au ratio d'export
 * Applique aspect-ratio CSS pour fixer les dimensions des containers
 */

export class ViewportRatioManager {
  constructor() {
    this.viewportSelectors = [
      '.viewport-front',
      '.viewport-back', 
      '.viewport-left',
      '.viewport-right',
      '.viewport-top',
      '.viewport-bottom',
      // Fallbacks pour différentes structures DOM
      '[data-view="front"]',
      '[data-view="back"]',
      '[data-view="left"]', 
      '[data-view="right"]',
      '[data-view="top"]',
      '[data-view="bottom"]',
      '#front-view',
      '#back-view',
      '#left-view',
      '#right-view', 
      '#top-view',
      '#bottom-view'
    ];
    
    this.styleElement = null;
    this.currentRatio = null;
    this.originalStyles = new Map();
  }

  /**
   * Active le ratio fixe pour tous les viewports
   */
  setExportRatio(aspectRatio) {
    this.currentRatio = aspectRatio;
    this.applyFixedRatio(aspectRatio);
    console.log(`📐 Viewports fixed to ratio: ${aspectRatio.toFixed(3)}`);
  }

  /**
   * Applique le ratio CSS
   */
  applyFixedRatio(ratio) {
    // Supprimer style précédent
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Créer nouveau style
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'viewport-ratio-override';
    
    // Générer CSS pour tous les sélecteurs possibles
    const selectors = this.viewportSelectors.join(', ');
    
    this.styleElement.textContent = `
      ${selectors} {
        aspect-ratio: ${ratio} !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
      }
      
      ${selectors} canvas {
        width: 100% !important;
        height: 100% !important;
        object-fit: fill !important;
      }
    `;
    
    document.head.appendChild(this.styleElement);
  }

  /**
   * Restaure les ratios responsives
   */
  removeFixedRatio() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    
    this.currentRatio = null;
    console.log('👁️ Viewports restored to responsive');
  }

  /**
   * Obtient le ratio actuel
   */
  getCurrentRatio() {
    return this.currentRatio;
  }

  /**
   * Vérifie si le mode ratio fixe est actif
   */
  isFixedRatioActive() {
    return this.currentRatio !== null;
  }
}
