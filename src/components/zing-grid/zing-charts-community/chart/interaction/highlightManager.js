import { BaseManager } from './baseManager';

export class HighlightManager extends BaseManager {
    constructor() {
        super(...arguments);
        this.highlightStates = new Map();
        this.pickedStates = new Map();
    }
    updateHighlight(callerId, highlightedDatum) {
        this.highlightStates.delete(callerId);
        if (highlightedDatum != null) {
            this.highlightStates.set(callerId, highlightedDatum);
        }
        this.applyHighlightStates();
    }
    getActiveHighlight() {
        return this.activeHighlight;
    }
    updatePicked(callerId, clickableDatum) {
        this.pickedStates.delete(callerId);
        if (clickableDatum != null) {
            this.pickedStates.set(callerId, clickableDatum);
        }
        this.applyPickedStates();
    }
    getActivePicked() {
        return this.activePicked;
    }
    applyHighlightStates() {
        // Last added entry wins.
        const { activeHighlight: previousHighlight } = this;
        this.activeHighlight = Array.from(this.highlightStates.values()).pop();
        if (!this.isEqual(this.activeHighlight, previousHighlight)) {
            this.listeners.dispatch('highlight-change', {
                type: 'highlight-change',
                currentHighlight: this.activeHighlight,
                previousHighlight,
            });
        }
    }
    applyPickedStates() {
        this.activePicked = Array.from(this.pickedStates.values()).pop();
    }
    isEqual(a, b) {
        return a === b || ((a === null || a === void 0 ? void 0 : a.series) === (b === null || b === void 0 ? void 0 : b.series) && (a === null || a === void 0 ? void 0 : a.itemId) === (b === null || b === void 0 ? void 0 : b.itemId) && (a === null || a === void 0 ? void 0 : a.datum) === (b === null || b === void 0 ? void 0 : b.datum));
    }
}
