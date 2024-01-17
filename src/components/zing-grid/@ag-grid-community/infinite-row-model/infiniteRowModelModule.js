import { ModuleNames } from "@/components/zing-grid/@ag-grid-community/core/main.js";
import { InfiniteRowModel } from "./infiniteRowModel/infiniteRowModel";
import { VERSION } from "./version";
export const InfiniteRowModelModule = {
    version: VERSION,
    moduleName: ModuleNames.InfiniteRowModelModule,
    rowModel: 'infinite',
    beans: [InfiniteRowModel],
};
//# sourceMappingURL=infiniteRowModelModule.js.map