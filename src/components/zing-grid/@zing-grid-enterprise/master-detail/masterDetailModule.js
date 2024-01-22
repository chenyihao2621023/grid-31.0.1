import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { DetailCellRenderer } from "./masterDetail/detailCellRenderer";
import { DetailCellRendererCtrl } from "./masterDetail/detailCellRendererCtrl";
import { VERSION } from "./version";
export const MasterDetailModule = {
    version: VERSION,
    moduleName: ModuleNames.MasterDetailModule,
    beans: [],
    userComponents: [
        { componentName: 'zingDetailCellRenderer', componentClass: DetailCellRenderer }
    ],
    controllers: [
        { controllerName: 'detailCellRenderer', controllerClass: DetailCellRendererCtrl }
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=masterDetailModule.js.map