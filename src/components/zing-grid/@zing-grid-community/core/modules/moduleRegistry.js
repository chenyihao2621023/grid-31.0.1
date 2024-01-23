import { ModuleNames } from "./moduleNames";
import { doOnce } from "../utils/function";
import { values } from "../utils/generic";
export class ModuleRegistry {
    
    static register(module) {
        ModuleRegistry.__register(module, true, undefined);
    }
    
    static registerModules(modules) {
        ModuleRegistry.__registerModules(modules, true, undefined);
    }
    
    static __register(module, moduleBased, gridId) {
        ModuleRegistry.runVersionChecks(module);
        if (gridId !== undefined) {
            ModuleRegistry.areGridScopedModules = true;
            if (ModuleRegistry.gridModulesMap[gridId] === undefined) {
                ModuleRegistry.gridModulesMap[gridId] = {};
            }
            ModuleRegistry.gridModulesMap[gridId][module.moduleName] = module;
        }
        else {
            ModuleRegistry.globalModulesMap[module.moduleName] = module;
        }
        ModuleRegistry.setModuleBased(moduleBased);
    }
    
    static __unRegisterGridModules(gridId) {
        delete ModuleRegistry.gridModulesMap[gridId];
    }
    
    static __registerModules(modules, moduleBased, gridId) {
        ModuleRegistry.setModuleBased(moduleBased);
        if (!modules) {
            return;
        }
        modules.forEach(module => ModuleRegistry.__register(module, moduleBased, gridId));
    }
    static isValidModuleVersion(module) {
        const [moduleMajor, moduleMinor] = module.version.split('.') || [];
        const [currentModuleMajor, currentModuleMinor] = ModuleRegistry.currentModuleVersion.split('.') || [];
        return moduleMajor === currentModuleMajor && moduleMinor === currentModuleMinor;
    }
    static runVersionChecks(module) {
        if (!ModuleRegistry.currentModuleVersion) {
            ModuleRegistry.currentModuleVersion = module.version;
        }
        if (!module.version) {
            console.error(`ZING Grid: You are using incompatible versions of ZING Grid modules. Major and minor versions should always match across modules. '${module.moduleName}' is incompatible. Please update all modules to the same version.`);
        }
        else if (!ModuleRegistry.isValidModuleVersion(module)) {
            console.error(`ZING Grid: You are using incompatible versions of ZING Grid modules. Major and minor versions should always match across modules. '${module.moduleName}' is version ${module.version} but the other modules are version ${this.currentModuleVersion}. Please update all modules to the same version.`);
        }
        if (module.validate) {
            const result = module.validate();
            if (!result.isValid) {
                const errorResult = result;
                console.error(`ZING Grid: ${errorResult.message}`);
            }
        }
    }
    static setModuleBased(moduleBased) {
        if (ModuleRegistry.moduleBased === undefined) {
            ModuleRegistry.moduleBased = moduleBased;
        }
        else {
            if (ModuleRegistry.moduleBased !== moduleBased) {
                doOnce(() => {
                    console.warn(`ZING Grid: You are mixing modules (i.e. @zing-grid-community/core) and packages (zing-grid-community) - you can only use one or the other of these mechanisms.`);
                    console.warn('Please see https://www.zing-grid.com/javascript-grid/packages-modules/ for more information.');
                }, 'ModulePackageCheck');
            }
        }
    }
    
    static __setIsBundled() {
        ModuleRegistry.isBundled = true;
    }
    
    static __assertRegistered(moduleName, reason, gridId) {
        var _a;
        if (this.__isRegistered(moduleName, gridId)) {
            return true;
        }
        const warningKey = reason + moduleName;
        let warningMessage;
        if (ModuleRegistry.isBundled) {
            {
                warningMessage =
                    `ZING Grid: unable to use ${reason} as 'zing-grid-enterprise' has not been loaded. Check you are using the Enterprise bundle:
        
        <script src="https://cdn.jsdelivr.net/npm/zing-grid-enterprise@AG_GRID_VERSION/dist/zing-grid-enterprise.min.js"></script>
        
For more info see: https://zing-grid.com/javascript-data-grid/getting-started/#getting-started-with-zing-grid-enterprise`;
            }
        }
        else if (ModuleRegistry.moduleBased || ModuleRegistry.moduleBased === undefined) {
            let modName = (_a = Object.entries(ModuleNames).find(([k, v]) => v === moduleName)) === null || _a === void 0 ? void 0 : _a[0];
            warningMessage =
                `ZING Grid: unable to use ${reason} as the ${modName} is not registered${ModuleRegistry.areGridScopedModules ? ` for gridId: ${gridId}` : ''}. Check if you have registered the module:
           
    import { ModuleRegistry } from '@/components/zing-grid/@zing-grid-community/core/main.js';
    import { ${modName} } from '${moduleName}';
    
    ModuleRegistry.registerModules([ ${modName} ]);

For more info see: https://www.zing-grid.com/javascript-grid/modules/`;
        }
        else {
            warningMessage =
                `ZING Grid: unable to use ${reason} as package 'zing-grid-enterprise' has not been imported. Check that you have imported the package:
            
    import 'zing-grid-enterprise';
            
For more info see: https://www.zing-grid.com/javascript-grid/packages/`;
        }
        doOnce(() => {
            console.warn(warningMessage);
        }, warningKey);
        return false;
    }
    
    static __isRegistered(moduleName, gridId) {
        var _a;
        return !!ModuleRegistry.globalModulesMap[moduleName] || !!((_a = ModuleRegistry.gridModulesMap[gridId]) === null || _a === void 0 ? void 0 : _a[moduleName]);
    }
    
    static __getRegisteredModules(gridId) {
        return [...values(ModuleRegistry.globalModulesMap), ...values(ModuleRegistry.gridModulesMap[gridId] || {})];
    }
    
    static __getGridRegisteredModules(gridId) {
        var _a;
        return values((_a = ModuleRegistry.gridModulesMap[gridId]) !== null && _a !== void 0 ? _a : {}) || [];
    }
    
    static __isPackageBased() {
        return !ModuleRegistry.moduleBased;
    }
}
// having in a map a) removes duplicates and b) allows fast lookup
ModuleRegistry.globalModulesMap = {};
ModuleRegistry.gridModulesMap = {};
ModuleRegistry.areGridScopedModules = false;
