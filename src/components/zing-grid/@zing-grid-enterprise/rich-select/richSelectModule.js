import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { RichSelectCellEditor } from "./richSelect/richSelectCellEditor";
import { VERSION } from "./version";
export const RichSelectModule = {
    version: VERSION,
    moduleName: ModuleNames.RichSelectModule,
    beans: [],
    userComponents: [
        { componentName: 'zingRichSelect', componentClass: RichSelectCellEditor },
        { componentName: 'zingRichSelectCellEditor', componentClass: RichSelectCellEditor }
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=richSelectModule.js.map