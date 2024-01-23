import { isString } from '../util/type-guards';
export class ModuleMap {
    constructor() {
        this.moduleMap = new Map();
    }
    addModule(module, moduleFactory) {
        if (this.moduleMap.has(module.optionsKey)) {
            throw new Error(`ZING Charts - module already initialised: ${module.optionsKey}`);
        }
        this.moduleMap.set(module.optionsKey, moduleFactory(module));
    }
    removeModule(module) {
        var _a;
        const moduleKey = isString(module) ? module : module.optionsKey;
        (_a = this.moduleMap.get(moduleKey)) === null || _a === void 0 ? void 0 : _a.destroy();
        this.moduleMap.delete(moduleKey);
    }
    isModuleEnabled(module) {
        return this.moduleMap.has(isString(module) ? module : module.optionsKey);
    }
    getModule(module) {
        return this.moduleMap.get(isString(module) ? module : module.optionsKey);
    }
    get modules() {
        return this.moduleMap.values();
    }
    mapValues(callback) {
        return Array.from(this.moduleMap.values()).map(callback);
    }
    destroy() {
        for (const optionsKey of this.moduleMap.keys()) {
            this.removeModule({ optionsKey });
        }
    }
}
