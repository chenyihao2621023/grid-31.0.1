export class Observable {
    constructor() {
        this.eventListeners = new Map();
    }
    addEventListener(eventType, listener) {
        if (typeof listener !== 'function') {
            throw new Error('AG Charts - listener must be a Function');
        }
        const eventTypeListeners = this.eventListeners.get(eventType);
        if (eventTypeListeners) {
            eventTypeListeners.add(listener);
        }
        else {
            this.eventListeners.set(eventType, new Set([listener]));
        }
    }
    removeEventListener(type, listener) {
        var _a;
        (_a = this.eventListeners.get(type)) === null || _a === void 0 ? void 0 : _a.delete(listener);
        if (this.eventListeners.size === 0) {
            this.eventListeners.delete(type);
        }
    }
    hasEventListener(type) {
        return this.eventListeners.has(type);
    }
    clearEventListeners() {
        this.eventListeners.clear();
    }
    fireEvent(event) {
        var _a;
        (_a = this.eventListeners.get(event.type)) === null || _a === void 0 ? void 0 : _a.forEach((listener) => listener(event));
    }
}
//# sourceMappingURL=observable.js.map