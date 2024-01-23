import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { PrimaryColsHeaderPanel } from "./columnToolPanel/primaryColsHeaderPanel";
import { PrimaryColsListPanel } from "./columnToolPanel/primaryColsListPanel";
import { ColumnToolPanel } from "./columnToolPanel/columnToolPanel";
import { PrimaryColsPanel } from "./columnToolPanel/primaryColsPanel";
import { RowGroupingModule } from "@/components/zing-grid/@zing-grid-enterprise/row-grouping/main.js";
import { SideBarModule } from "@/components/zing-grid/@zing-grid-enterprise/side-bar/main.js";
import { ModelItemUtils } from "./columnToolPanel/modelItemUtils";
import { VERSION } from "./version";
export const ColumnsToolPanelModule = {
  version: VERSION,
  moduleName: ModuleNames.ColumnsToolPanelModule,
  beans: [ModelItemUtils],
  zingStackComponents: [{
    componentName: 'ZingPrimaryColsHeader',
    componentClass: PrimaryColsHeaderPanel
  }, {
    componentName: 'ZingPrimaryColsList',
    componentClass: PrimaryColsListPanel
  }, {
    componentName: 'ZingPrimaryCols',
    componentClass: PrimaryColsPanel
  }],
  userComponents: [{
    componentName: 'zingColumnsToolPanel',
    componentClass: ColumnToolPanel
  }],
  dependantModules: [EnterpriseCoreModule, RowGroupingModule, SideBarModule]
};