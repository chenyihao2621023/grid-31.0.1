import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { GridLicenseManager as LicenseManager } from "./license/gridLicenseManager";
import { WatermarkComp } from "./license/watermark";
export { WatermarkComp } from "./license/watermark";
import { VERSION } from "./version";
export const EnterpriseCoreModule = {
  version: VERSION,
  moduleName: ModuleNames.EnterpriseCoreModule,
  beans: [LicenseManager],
  zingStackComponents: [{
    componentName: 'ZingWatermark',
    componentClass: WatermarkComp
  }]
};