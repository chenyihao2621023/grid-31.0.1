import { ModuleNames } from "@/components/zing-grid/@ag-grid-community/core/main.js";
import { CsvCreator } from "./csvExport/csvCreator";
import { GridSerializer } from "./csvExport/gridSerializer";
import { VERSION } from "./version";
export const CsvExportModule = {
    version: VERSION,
    moduleName: ModuleNames.CsvExportModule,
    beans: [CsvCreator, GridSerializer]
};
//# sourceMappingURL=csvExportModule.js.map