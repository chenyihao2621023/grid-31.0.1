import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { RangeService } from "./rangeSelection/rangeService";
import { FillHandle } from "./rangeSelection/fillHandle";
import { RangeHandle } from "./rangeSelection/rangeHandle";
import { SelectionHandleFactory } from "./rangeSelection/selectionHandleFactory";
import { VERSION } from "./version";
export const RangeSelectionModule = {
  version: VERSION,
  moduleName: ModuleNames.RangeSelectionModule,
  beans: [RangeService, SelectionHandleFactory],
  zingStackComponents: [{
    componentName: 'ZingFillHandle',
    componentClass: FillHandle
  }, {
    componentName: 'ZingRangeHandle',
    componentClass: RangeHandle
  }],
  dependantModules: [EnterpriseCoreModule]
};