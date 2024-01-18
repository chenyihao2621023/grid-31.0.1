import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { ExcelCreator } from "./excelExport/excelCreator";
import { CsvCreator, GridSerializer } from "@/components/zing-grid/@zing-grid-community/csv-export/main.js";
import { CsvExportModule } from "@/components/zing-grid/@zing-grid-community/csv-export/main.js";
import { VERSION } from "./version";
export const ExcelExportModule = {
    version: VERSION,
    moduleName: ModuleNames.ExcelExportModule,
    beans: [
        // beans in this module
        ExcelCreator,
        // these beans are part of CSV Export module
        GridSerializer, CsvCreator
    ],
    dependantModules: [
        CsvExportModule,
        EnterpriseCoreModule
    ]
};
//# sourceMappingURL=excelExportModule.js.map