import { Listeners } from '../../util/listeners';
export class BaseManager {
    constructor() {
        this.listeners = new Listeners();
    }
    addListener(type, handler, meta) {
        return this.listeners.addListener(type, handler, meta);
    }
    removeListener(listenerSymbol) {
        this.listeners.removeListener(listenerSymbol);
    }
}
//# sourceMappingURL=baseManager.js.map