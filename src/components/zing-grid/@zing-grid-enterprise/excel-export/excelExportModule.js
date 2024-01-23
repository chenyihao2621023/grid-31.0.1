import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { ExcelCreator } from "./excelExport/excelCreator";
import { CsvCreator, GridSerializer } from "@/components/zing-grid/@zing-grid-community/csv-export/main.js";
import { CsvExportModule } from "@/components/zing-grid/@zing-grid-community/csv-export/main.js";
import { VERSION } from "./version";
export const ExcelExportModule = {
  version: VERSION,
  moduleName: ModuleNames.ExcelExportModule,
  beans: [ExcelCreator, GridSerializer, CsvCreator],
  dependantModules: [CsvExportModule, EnterpriseCoreModule]
};