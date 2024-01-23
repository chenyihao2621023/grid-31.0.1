export var ModuleNames;
(function (ModuleNames) {
    ModuleNames["CommunityCoreModule"] = "@/components/zing-grid/@zing-grid-community/core/main.js";
    // community modules
    ModuleNames["InfiniteRowModelModule"] = "@/components/zing-grid/@zing-grid-community/infinite-row-model/main.js";
    ModuleNames["ClientSideRowModelModule"] = "@/components/zing-grid/@zing-grid-community/client-side-row-model/main.js";
    ModuleNames["CsvExportModule"] = "@/components/zing-grid/@zing-grid-community/csv-export";
    // enterprise core - users don't need to import on this, but other enterprise modules do
    ModuleNames["EnterpriseCoreModule"] = "@/components/zing-grid/@zing-grid-enterprise/core/main.js";
    // enterprise modules
    ModuleNames["RowGroupingModule"] = "@/components/zing-grid/@zing-grid-enterprise/row-grouping/main.js";
    ModuleNames["ColumnsToolPanelModule"] = "@/components/zing-grid/@zing-grid-enterprise/column-tool-panel/main.js";
    ModuleNames["FiltersToolPanelModule"] = "@/components/zing-grid/@zing-grid-enterprise/filter-tool-panel/main.js";
    ModuleNames["MenuModule"] = "@/components/zing-grid/@zing-grid-enterprise/menu/main.js";
    ModuleNames["SetFilterModule"] = "@/components/zing-grid/@zing-grid-enterprise/set-filter/main.js";
    ModuleNames["MultiFilterModule"] = "@/components/zing-grid/@zing-grid-enterprise/multi-filter/main.js";
    ModuleNames["StatusBarModule"] = "@/components/zing-grid/@zing-grid-enterprise/status-bar/main.js";
    ModuleNames["SideBarModule"] = "@/components/zing-grid/@zing-grid-enterprise/side-bar/main.js";
    ModuleNames["RangeSelectionModule"] = "@/components/zing-grid/@zing-grid-enterprise/range-selection/main.js";
    ModuleNames["MasterDetailModule"] = "@/components/zing-grid/@zing-grid-enterprise/master-detail/main.js";
    ModuleNames["RichSelectModule"] = "@/components/zing-grid/@zing-grid-enterprise/rich-select/main.js";
    ModuleNames["GridChartsModule"] = "@/components/zing-grid/@zing-grid-enterprise/charts/main.js";
    ModuleNames["ViewportRowModelModule"] = "@/components/zing-grid/@zing-grid-enterprise/viewport-row-model/main.js";
    ModuleNames["ServerSideRowModelModule"] = "@/components/zing-grid/@zing-grid-enterprise/server-side-row-model/main.js";
    ModuleNames["ExcelExportModule"] = "@/components/zing-grid/@zing-grid-enterprise/excel-export/main.js";
    ModuleNames["ClipboardModule"] = "@/components/zing-grid/@zing-grid-enterprise/clipboard/main.js";
    ModuleNames["SparklinesModule"] = "@/components/zing-grid/@zing-grid-enterprise/sparklines/main.js";
    ModuleNames["AdvancedFilterModule"] = "@/components/zing-grid/@zing-grid-enterprise/advanced-filter/main.js";
    // framework wrappers currently don't provide beans, comps etc, so no need to be modules,
    // however i argue they should be as in theory they 'could' provide beans etc
    ModuleNames["AngularModule"] = "@zing-grid-community/angular";
    ModuleNames["ReactModule"] = "@zing-grid-community/react";
    ModuleNames["VueModule"] = "@zing-grid-community/vue";
    // and then this, which is definitely not a grid module, as it should not have any dependency
    // on the grid (ie shouldn't even reference the Module interface)
    // ChartsModule = "@zing-grid-community/charts-core",
})(ModuleNames || (ModuleNames = {}));
