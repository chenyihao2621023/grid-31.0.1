import { ModuleNames } from '@/components/zing-grid/@ag-grid-community/core/main.js';
import { EnterpriseCoreModule } from '@/components/zing-grid/@ag-grid-enterprise/core/main.js';
import { SetFilter } from './setFilter/setFilter';
import { SetFloatingFilterComp } from './setFilter/setFloatingFilter';
import { VERSION } from './version';
export const SetFilterModule = {
    version: VERSION,
    moduleName: ModuleNames.SetFilterModule,
    beans: [],
    userComponents: [
        { componentName: 'agSetColumnFilter', componentClass: SetFilter },
        { componentName: 'agSetColumnFloatingFilter', componentClass: SetFloatingFilterComp },
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=setFilterModule.js.map