import { ModuleNames } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { EnterpriseCoreModule } from '@/components/zing-grid/@zing-grid-enterprise/core/main.js';
import { MultiFilter } from './multiFilter/multiFilter';
import { MultiFloatingFilterComp } from './multiFilter/multiFloatingFilter';
import { VERSION } from './version';
export const MultiFilterModule = {
    version: VERSION,
    moduleName: ModuleNames.MultiFilterModule,
    beans: [],
    userComponents: [
        { componentName: 'zingMultiColumnFilter'', componentClass: MultiFilter },
        { componentName: 'zingMultiColumnFloatingFilter'', componentClass: MultiFloatingFilterComp },
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=multiFilterModule.js.map