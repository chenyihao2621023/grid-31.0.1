/**
 * Manages the cursor styling for an element. Tracks the requested styling from distinct
 * dependents and handles conflicting styling requests.
 */
export class CursorManager {
    constructor(element) {
        this.states = {};
        this.element = element;
    }
    updateCursor(callerId, style) {
        delete this.states[callerId];
        if (style != null) {
            this.states[callerId] = { style };
        }
        this.applyStates();
    }
    applyStates() {
        let styleToApply = 'default';
        // Last added entry wins.
        Object.entries(this.states)
            .reverse()
            .slice(0, 1)
            .forEach(([_, { style }]) => (styleToApply = style));
        this.element.style.cursor = styleToApply;
    }
    getCursor() {
        return this.element.style.cursor;
    }
}
//# sourceMappingURL=cursorManager.js.map