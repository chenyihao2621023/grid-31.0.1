import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { VERSION } from "./version";
import { ViewportRowModel } from "./viewportRowModel/viewportRowModel";
export const ViewportRowModelModule = {
    version: VERSION,
    moduleName: ModuleNames.ViewportRowModelModule,
    rowModel: 'viewport',
    beans: [ViewportRowModel],
    dependantModules: [
        EnterpriseCoreModule
    ]
};
