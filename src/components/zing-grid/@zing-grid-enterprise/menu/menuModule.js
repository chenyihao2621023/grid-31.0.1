import { ModuleNames } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { EnterpriseCoreModule } from "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
import { EnterpriseMenuFactory } from "./menu/enterpriseMenu";
import { ContextMenuFactory } from "./menu/contextMenu";
import { MenuItemMapper } from "./menu/menuItemMapper";
import { VERSION } from "./version";
import { ChartMenuItemMapper } from "./menu/chartMenuItemMapper";
export const MenuModule = {
  version: VERSION,
  moduleName: ModuleNames.MenuModule,
  beans: [EnterpriseMenuFactory, ContextMenuFactory, MenuItemMapper, ChartMenuItemMapper],
  dependantModules: [EnterpriseCoreModule]
};