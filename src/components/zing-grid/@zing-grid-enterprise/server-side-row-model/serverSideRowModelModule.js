import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { ServerSideRowModel } from "./serverSideRowModel/serverSideRowModel";
import { StoreUtils } from "./serverSideRowModel/stores/storeUtils";
import { BlockUtils } from "./serverSideRowModel/blocks/blockUtils";
import { NodeManager } from "./serverSideRowModel/nodeManager";
import { TransactionManager } from "./serverSideRowModel/transactionManager";
import { ExpandListener } from "./serverSideRowModel/listeners/expandListener";
import { SortListener } from "./serverSideRowModel/listeners/sortListener";
import { FilterListener } from "./serverSideRowModel/listeners/filterListener";
import { StoreFactory } from "./serverSideRowModel/stores/storeFactory";
import { ListenerUtils } from "./serverSideRowModel/listeners/listenerUtils";
import { ServerSideSelectionService } from "./serverSideRowModel/services/serverSideSelectionService";
import { VERSION } from "./version";
import { ServerSideExpansionService } from "./serverSideRowModel/services/serverSideExpansionService";
export const ServerSideRowModelModule = {
  version: VERSION,
  moduleName: ModuleNames.ServerSideRowModelModule,
  rowModel: 'serverSide',
  beans: [ServerSideRowModel, ExpandListener, SortListener, StoreUtils, BlockUtils, NodeManager, TransactionManager, FilterListener, StoreFactory, ListenerUtils, ServerSideSelectionService, ServerSideExpansionService],
  dependantModules: [EnterpriseCoreModule]
};