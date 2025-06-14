/**
 * ViewportRatioManager.js - Disable grid system and apply ratios
 */

export class ViewportRatioManager {
  constructor() {
    this.styleElement = null;
    this.currentRatio = null;
    this.originalStyles = new Map();
  }

  setExportRatio(aspectRatio) {
    this.currentRatio = aspectRatio;
    this.disableGridSystem();
    this.applyRatioSystem(aspectRatio);
    console.log(`📐 Grid disabled, ratio applied: ${aspectRatio.toFixed(3)}`);
  }

  /**
   * Disable all grid systems
   */
  disableGridSystem() {
    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'grid-disable-override';
    
    this.styleElement.textContent = `
      /* DISABLE ALL GRIDS */
      .viewport-grid,
      .viewport-container,
      [class*="grid"],
      [style*="grid"],
      [style*="display: grid"],
      [style*="display:grid"] {
        display: flex !important;
        flex-direction: column !important;
        flex-wrap: wrap !important;
        grid-template-columns: none !important;
        grid-template-rows: none !important;
        grid-auto-rows: none !important;
        grid-auto-columns: none !important;
        grid-gap: 0 !important;
        gap: 5px !important;
      }
      
      /* Reset all viewport children */
      .viewport-grid > *,
      .viewport-container > * {
        flex: none !important;
        width: 100% !important;
        height: auto !important;
        grid-column: unset !important;
        grid-row: unset !important;
      }
    `;
    
    document.head.appendChild(this.styleElement);
  }

  /**
   * Apply ratio system after grid removal
   */
  applyRatioSystem(ratio) {
    const ratioStyle = document.createElement('style');
    ratioStyle.id = 'ratio-system';
    
    ratioStyle.textContent = `
      /* Apply ratios to all viewport elements */
      canvas,
      canvas:parent,
      .viewport,
      .view,
      [class*="viewport"],
      [class*="view"],
      [id*="canvas"] {
        aspect-ratio: ${ratio} !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
      }
    `;
    
    document.head.appendChild(ratioStyle);
    
    // Force on DOM elements directly
    this.forceElementStyles(ratio);
  }

  /**
   * Force styles directly on DOM elements
   */
  forceElementStyles(ratio) {
    // Disable grid on grid containers
    document.querySelectorAll('[class*="grid"], [style*="grid"]').forEach(el => {
      el.style.setProperty('display', 'flex', 'important');
      el.style.setProperty('flex-direction', 'column', 'important');
      el.style.setProperty('grid-template-columns', 'none', 'important');
      el.style.setProperty('grid-template-rows', 'none', 'important');
    });

    // Apply ratios to viewports
    document.querySelectorAll('canvas').forEach(canvas => {
      canvas.style.setProperty('aspect-ratio', ratio.toString(), 'important');
      
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.setProperty('aspect-ratio', ratio.toString(), 'important');
        parent.style.setProperty('height', 'auto', 'important');
        parent.style.setProperty('width', '100%', 'important');
      }
    });
  }

  removeFixedRatio() {
    // Remove style elements
    document.querySelectorAll('#grid-disable-override, #ratio-system').forEach(el => el.remove());
    
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Restore original styles
    document.querySelectorAll('canvas').forEach(canvas => {
      canvas.style.removeProperty('aspect-ratio');
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.removeProperty('aspect-ratio');
        parent.style.removeProperty('height');
        parent.style.removeProperty('display');
      }
    });

    this.currentRatio = null;
    console.log('🔄 Grid system restored');
  }

  getCurrentRatio() {
    return this.currentRatio;
  }

  isFixedRatioActive() {
    return this.currentRatio !== null;
  }
}
