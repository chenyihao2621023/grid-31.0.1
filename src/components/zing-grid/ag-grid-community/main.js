import { ClientSideRowModelModule } from '@/components/zing-grid/@ag-grid-community/client-side-row-model/main.js';
import { InfiniteRowModelModule } from '@/components/zing-grid/@ag-grid-community/infinite-row-model/main.js';
import { CsvExportModule } from '@/components/zing-grid/@ag-grid-community/csv-export/main.js';
import { ModuleRegistry } from "@/components/zing-grid/@ag-grid-community/core/main.js";
ModuleRegistry.__registerModules([ClientSideRowModelModule, InfiniteRowModelModule, CsvExportModule], false, undefined);
export * from "@/components/zing-grid/@ag-grid-community/core/main.js";
export * from "@/components/zing-grid/@ag-grid-community/csv-export/main.js";
