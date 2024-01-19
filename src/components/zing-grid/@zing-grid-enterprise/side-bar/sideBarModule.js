import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { HorizontalResizeComp } from "./sideBar/horizontalResizeComp";
import { SideBarComp } from "./sideBar/sideBarComp";
import { SideBarButtonsComp } from "./sideBar/sideBarButtonsComp";
import { ToolPanelColDefService } from "./sideBar/common/toolPanelColDefService";
import { VERSION } from "./version";
import { SideBarService } from "./sideBar/sideBarService";
export const SideBarModule = {
    version: VERSION,
    moduleName: ModuleNames.SideBarModule,
    beans: [ToolPanelColDefService, SideBarService],
    zingStackComponents: [
        { componentName: 'ZingHorizontalResize', componentClass: HorizontalResizeComp },
        { componentName: 'ZingSideBar', componentClass: SideBarComp },
        { componentName: 'ZingSideBarButtons', componentClass: SideBarButtonsComp },
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=sideBarModule.js.map