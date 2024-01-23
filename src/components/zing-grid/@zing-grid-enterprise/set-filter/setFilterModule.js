import { ModuleNames } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { EnterpriseCoreModule } from '@/components/zing-grid/@zing-grid-enterprise/core/main.js';
import { SetFilter } from './setFilter/setFilter';
import { SetFloatingFilterComp } from './setFilter/setFloatingFilter';
import { VERSION } from './version';
export const SetFilterModule = {
  version: VERSION,
  moduleName: ModuleNames.SetFilterModule,
  beans: [],
  userComponents: [{
    componentName: 'zingSetColumnFilter',
    componentClass: SetFilter
  }, {
    componentName: 'zingSetColumnFloatingFilter',
    componentClass: SetFloatingFilterComp
  }],
  dependantModules: [EnterpriseCoreModule]
};