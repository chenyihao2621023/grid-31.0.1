import { ModuleNames } from "@/components/zing-grid/@ag-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@ag-grid-enterprise/core/main.js";
import { CsvExportModule } from "@/components/zing-grid/@ag-grid-community/csv-export/main.js";
import { ClipboardService } from "./clipboard/clipboardService";
import { VERSION } from "./version";
export const ClipboardModule = {
    version: VERSION,
    moduleName: ModuleNames.ClipboardModule,
    beans: [ClipboardService],
    dependantModules: [
        EnterpriseCoreModule,
        CsvExportModule
    ]
};
//# sourceMappingURL=clipboardModule.js.map