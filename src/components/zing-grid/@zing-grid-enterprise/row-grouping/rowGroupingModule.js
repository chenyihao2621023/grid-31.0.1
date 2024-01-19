import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { AggregationStage } from "./rowGrouping/aggregationStage";
import { GroupStage } from "./rowGrouping/groupStage";
import { PivotColDefService } from "./rowGrouping/pivotColDefService";
import { PivotStage } from "./rowGrouping/pivotStage";
import { AggFuncService } from "./rowGrouping/aggFuncService";
import { GridHeaderDropZones } from "./rowGrouping/columnDropZones/gridHeaderDropZones";
import { FilterAggregatesStage } from "./rowGrouping/filterAggregatesStage";
import { VERSION } from "./version";
import { GroupFilter } from "./rowGrouping/groupFilter/groupFilter";
import { GroupFloatingFilterComp } from "./rowGrouping/groupFilter/groupFloatingFilter";
export const RowGroupingModule = {
    version: VERSION,
    moduleName: ModuleNames.RowGroupingModule,
    beans: [AggregationStage, FilterAggregatesStage, GroupStage, PivotColDefService, PivotStage, AggFuncService],
    zingStackComponents: [
        { componentName: 'ZingGridHeaderDropZones', componentClass: GridHeaderDropZones }
    ],
    userComponents: [
        { componentName: 'zingGroupColumnFilter'', componentClass: GroupFilter },
        { componentName: 'zingGroupColumnFloatingFilter'', componentClass: GroupFloatingFilterComp },
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=rowGroupingModule.js.map