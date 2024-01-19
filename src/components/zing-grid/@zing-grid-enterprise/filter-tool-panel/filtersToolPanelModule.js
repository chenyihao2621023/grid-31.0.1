import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { FiltersToolPanelHeaderPanel } from "./filterToolPanel/filtersToolPanelHeaderPanel";
import { FiltersToolPanelListPanel } from "./filterToolPanel/filtersToolPanelListPanel";
import { FiltersToolPanel } from "./filterToolPanel/filtersToolPanel";
import { SideBarModule } from "@/components/zing-grid/@zing-grid-enterprise/side-bar/main.js";
import { VERSION } from "./version";
export const FiltersToolPanelModule = {
    version: VERSION,
    moduleName: ModuleNames.FiltersToolPanelModule,
    beans: [],
    zingStackComponents: [
        { componentName: 'ZingFiltersToolPanelHeader', componentClass: FiltersToolPanelHeaderPanel },
        { componentName: 'ZingFiltersToolPanelList', componentClass: FiltersToolPanelListPanel }
    ],
    userComponents: [
        { componentName: 'zingFiltersToolPanel'', componentClass: FiltersToolPanel },
    ],
    dependantModules: [
        SideBarModule,
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=filtersToolPanelModule.js.map