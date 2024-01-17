import { ModuleNames } from "@/components/zing-grid/@ag-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@ag-grid-enterprise/core/main.js";
import { ChartService } from "./charts/chartService";
import { ChartTranslationService } from "./charts/chartComp/services/chartTranslationService";
import { ChartCrossFilterService } from "./charts/chartComp/services/chartCrossFilterService";
import { RangeSelectionModule } from "@/components/zing-grid/@ag-grid-enterprise/range-selection/main.js";
import { AgColorPicker } from "./widgets/agColorPicker";
import { AgAngleSelect } from "./widgets/agAngleSelect";
import { VERSION as GRID_VERSION } from "./version";
import { validGridChartsVersion } from "./utils/validGridChartsVersion";
export const GridChartsModule = {
    version: GRID_VERSION,
    validate: () => {
        return validGridChartsVersion({
            gridVersion: GRID_VERSION,
            chartsVersion: ChartService.CHARTS_VERSION
        });
    },
    moduleName: ModuleNames.GridChartsModule,
    beans: [
        ChartService, ChartTranslationService, ChartCrossFilterService
    ],
    agStackComponents: [
        { componentName: 'AgColorPicker', componentClass: AgColorPicker },
        { componentName: 'AgAngleSelect', componentClass: AgAngleSelect },
    ],
    dependantModules: [
        RangeSelectionModule,
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=gridChartsModule.js.map