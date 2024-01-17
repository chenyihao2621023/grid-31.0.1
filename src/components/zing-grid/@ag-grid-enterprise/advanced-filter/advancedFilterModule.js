import { ModuleNames } from "@/components/zing-grid/@ag-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@ag-grid-enterprise/core/main.js";
import { AdvancedFilterComp } from "./advancedFilter/advancedFilterComp";
import { AdvancedFilterExpressionService } from "./advancedFilter/advancedFilterExpressionService";
import { AdvancedFilterService } from "./advancedFilter/advancedFilterService";
import { VERSION } from "./version";
export const AdvancedFilterModule = {
    version: VERSION,
    moduleName: ModuleNames.AdvancedFilterModule,
    beans: [AdvancedFilterService, AdvancedFilterExpressionService],
    agStackComponents: [
        { componentName: 'agAdvancedFilter', componentClass: AdvancedFilterComp }
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=advancedFilterModule.js.map