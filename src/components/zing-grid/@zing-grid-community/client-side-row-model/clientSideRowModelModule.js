import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { ClientSideRowModel } from "./clientSideRowModel/clientSideRowModel";
import { FilterStage } from "./clientSideRowModel/filterStage";
import { SortStage } from "./clientSideRowModel/sortStage";
import { FlattenStage } from "./clientSideRowModel/flattenStage";
import { SortService } from "./clientSideRowModel/sortService";
import { FilterService } from "./clientSideRowModel/filterService";
import { ImmutableService } from "./clientSideRowModel/immutableService";
import { VERSION } from "./version";
export const ClientSideRowModelModule = {
  version: VERSION,
  moduleName: ModuleNames.ClientSideRowModelModule,
  rowModel: 'clientSide',
  beans: [ClientSideRowModel, FilterStage, SortStage, FlattenStage, SortService, FilterService, ImmutableService]
};