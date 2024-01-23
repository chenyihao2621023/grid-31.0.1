import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { ChartService } from "./charts/chartService";
import { ChartTranslationService } from "./charts/chartComp/services/chartTranslationService";
import { ChartCrossFilterService } from "./charts/chartComp/services/chartCrossFilterService";
import { RangeSelectionModule } from "@/components/zing-grid/@zing-grid-enterprise/range-selection/main.js";
import { ZingColorPicker } from "./widgets/zingColorPicker";
import { ZingAngleSelect } from "./widgets/zingAngleSelect";
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
    zingStackComponents: [
        { componentName: 'ZingColorPicker', componentClass: ZingColorPicker },
        { componentName: 'ZingAngleSelect', componentClass: ZingAngleSelect },
    ],
    dependantModules: [
        RangeSelectionModule,
        EnterpriseCoreModule
    ]
};
