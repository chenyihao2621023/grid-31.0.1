import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { StatusBarService } from "./statusBar/statusBarService";
import { StatusBar } from "./statusBar/statusBar";
import { NameValueComp } from "./statusBar/providedPanels/nameValueComp";
import { TotalAndFilteredRowsComp } from "./statusBar/providedPanels/totalAndFilteredRowsComp";
import { FilteredRowsComp } from "./statusBar/providedPanels/filteredRowsComp";
import { TotalRowsComp } from "./statusBar/providedPanels/totalRowsComp";
import { SelectedRowsComp } from "./statusBar/providedPanels/selectedRowsComp";
import { AggregationComp } from "./statusBar/providedPanels/aggregationComp";
import { VERSION } from "./version";
export const StatusBarModule = {
    version: VERSION,
    moduleName: ModuleNames.StatusBarModule,
    beans: [StatusBarService],
    zingStackComponents: [
        { componentName: 'ZingStatusBar', componentClass: StatusBar },
        { componentName: 'ZingNameValue', componentClass: NameValueComp },
    ],
    userComponents: [
        { componentName: 'zingAggregationComponent'', componentClass: AggregationComp },
        { componentName: 'zingSelectedRowCountComponent'', componentClass: SelectedRowsComp },
        { componentName: 'zingTotalRowCountComponent'', componentClass: TotalRowsComp },
        { componentName: 'zingFilteredRowCountComponent'', componentClass: FilteredRowsComp },
        { componentName: 'zingTotalAndFilteredRowCountComponent'', componentClass: TotalAndFilteredRowsComp }
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=statusBarModule.js.map