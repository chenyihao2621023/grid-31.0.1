import { ModuleNames } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { EnterpriseCoreModule } from '@/components/zing-grid/@zing-grid-enterprise/core/main.js';
import { SparklineCellRenderer } from './sparklineCellRenderer';
import { SparklineTooltipSingleton } from './tooltip/sparklineTooltipSingleton';
import { VERSION } from './version';
export const SparklinesModule = {
    version: VERSION,
    moduleName: ModuleNames.SparklinesModule,
    beans: [SparklineTooltipSingleton],
    userComponents: [{ componentName: 'agSparklineCellRenderer', componentClass: SparklineCellRenderer }],
    dependantModules: [EnterpriseCoreModule],
};
//# sourceMappingURL=sparklinesModule.js.map