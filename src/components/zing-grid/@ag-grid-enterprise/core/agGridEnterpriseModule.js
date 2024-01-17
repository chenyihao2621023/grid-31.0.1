import { ModuleNames } from "@/components/zing-grid/@ag-grid-community/core/main.js";
import { GridLicenseManager as LicenseManager } from "./license/gridLicenseManager";
import { WatermarkComp } from "./license/watermark";
export { WatermarkComp } from "./license/watermark";
import { VERSION } from "./version";
export const EnterpriseCoreModule = {
    version: VERSION,
    moduleName: ModuleNames.EnterpriseCoreModule,
    beans: [LicenseManager],
    agStackComponents: [
        { componentName: 'AgWatermark', componentClass: WatermarkComp }
    ]
};
//# sourceMappingURL=agGridEnterpriseModule.js.map