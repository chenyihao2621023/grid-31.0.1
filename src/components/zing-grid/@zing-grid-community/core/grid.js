import { SelectionService } from "./selectionService";
import { ColumnApi } from "./columns/columnApi";
import { ColumnModel } from "./columns/columnModel";
import { RowRenderer } from "./rendering/rowRenderer";
import { GridHeaderComp } from "./headerRendering/gridHeaderComp";
import { FilterManager } from "./filter/filterManager";
import { ValueService } from "./valueService/valueService";
import { EventService } from "./eventService";
import { GridBodyComp } from "./gridBodyComp/gridBodyComp";
import { GridApi } from "./gridApi";
import { ColumnFactory } from "./columns/columnFactory";
import { DisplayedGroupCreator } from "./columns/displayedGroupCreator";
import { ExpressionService } from "./valueService/expressionService";
import { TemplateService } from "./templateService";
import { PopupService } from "./widgets/popupService";
import { Logger, LoggerFactory } from "./logger";
import { ColumnUtils } from "./columns/columnUtils";
import { AutoWidthCalculator } from "./rendering/autoWidthCalculator";
import { HorizontalResizeService } from "./headerRendering/common/horizontalResizeService";
import { Context } from "./context/context";
import { GridComp } from "./gridComp/gridComp";
import { DragAndDropService } from "./dragAndDrop/dragAndDropService";
import { DragService } from "./dragAndDrop/dragService";
import { SortController } from "./sortController";
import { FocusService } from "./focusService";
import { MouseEventService } from "./gridBodyComp/mouseEventService";
import { CellNavigationService } from "./cellNavigationService";
import { ValueFormatterService } from "./rendering/valueFormatterService";
import { ZingCheckbox } from "./widgets/zingCheckbox";
import { ZingRadioButton } from "./widgets/zingRadioButton";
import { VanillaFrameworkOverrides } from "./vanillaFrameworkOverrides";
import { ScrollVisibleService } from "./gridBodyComp/scrollVisibleService";
import { StylingService } from "./styling/stylingService";
import { ColumnHoverService } from "./rendering/columnHoverService";
import { ColumnAnimationService } from "./rendering/columnAnimationService";
import { AutoGroupColService } from "./columns/autoGroupColService";
import { PaginationProxy } from "./pagination/paginationProxy";
import { PaginationAutoPageSizeService } from "./pagination/paginationAutoPageSizeService";
import { ValueCache } from "./valueService/valueCache";
import { ChangeDetectionService } from "./valueService/changeDetectionService";
import { AlignedGridsService } from "./alignedGridsService";
import { UserComponentFactory } from "./components/framework/userComponentFactory";
import { UserComponentRegistry } from "./components/framework/userComponentRegistry";
import { ZingComponentUtils } from "./components/framework/zingComponentUtils";
import { ComponentMetadataProvider } from "./components/framework/componentMetadataProvider";
import { Beans } from "./rendering/beans";
import { Environment } from "./environment";
import { AnimationFrameService } from "./misc/animationFrameService";
import { NavigationService } from "./gridBodyComp/navigationService";
import { RowContainerHeightService } from "./rendering/rowContainerHeightService";
import { SelectableService } from "./rowNodes/selectableService";
import { PaginationComp } from "./pagination/paginationComp";
import { ResizeObserverService } from "./misc/resizeObserverService";
import { OverlayWrapperComponent } from "./rendering/overlays/overlayWrapperComponent";
import { ZingGroupComponent } from "./widgets/zingGroupComponent";
import { ZingDialog } from "./widgets/zingDialog";
import { ZingPanel } from "./widgets/zingPanel";
import { ZingInputTextField } from "./widgets/zingInputTextField";
import { ZingInputTextArea } from "./widgets/zingInputTextArea";
import { ZingSlider } from "./widgets/zingSlider";
import { ZingInputNumberField } from "./widgets/zingInputNumberField";
import { ZingInputRange } from "./widgets/zingInputRange";
import { ZingSelect } from "./widgets/zingSelect";
import { ZingRichSelect } from "./widgets/zingRichSelect";
import { ZingToggleButton } from "./widgets/zingToggleButton";
import { RowPositionUtils } from "./entities/rowPositionUtils";
import { CellPositionUtils } from "./entities/cellPositionUtils";
import { PinnedRowModel } from "./pinnedRowModel/pinnedRowModel";
import { ModuleRegistry } from "./modules/moduleRegistry";
import { ModuleNames } from "./modules/moduleNames";
import { UndoRedoService } from "./undoRedo/undoRedoService";
import { ZingStackComponentsRegistry } from "./components/zingStackComponentsRegistry";
import { HeaderPositionUtils } from "./headerRendering/common/headerPosition";
import { HeaderNavigationService } from "./headerRendering/common/headerNavigationService";
import { missing } from "./utils/generic";
import { ColumnDefFactory } from "./columns/columnDefFactory";
import { RowCssClassCalculator } from "./rendering/row/rowCssClassCalculator";
import { RowNodeBlockLoader } from "./rowNodeCache/rowNodeBlockLoader";
import { RowNodeSorter } from "./rowNodes/rowNodeSorter";
import { CtrlsService } from "./ctrlsService";
import { CtrlsFactory } from "./ctrlsFactory";
import { FakeHScrollComp } from "./gridBodyComp/fakeHScrollComp";
import { PinnedWidthService } from "./gridBodyComp/pinnedWidthService";
import { RowContainerComp } from "./gridBodyComp/rowContainer/rowContainerComp";
import { RowNodeEventThrottle } from "./entities/rowNodeEventThrottle";
import { StandardMenuFactory } from "./headerRendering/cells/column/standardMenu";
import { SortIndicatorComp } from "./headerRendering/cells/column/sortIndicatorComp";
import { GridOptionsService } from "./gridOptionsService";
import { LocaleService } from "./localeService";
import { FakeVScrollComp } from "./gridBodyComp/fakeVScrollComp";
import { DataTypeService } from "./columns/dataTypeService";
import { ZingInputDateField } from "./widgets/zingInputDateField";
import { ValueParserService } from "./valueService/valueParserService";
import { ZingAutocomplete } from "./widgets/zingAutocomplete";
import { QuickFilterService } from "./filter/quickFilterService";
import { warnOnce, errorOnce } from "./utils/function";
import { SyncService } from "./syncService";
import { OverlayService } from "./rendering/overlays/overlayService";
import { StateService } from "./misc/stateService";
import { ExpansionService } from "./misc/expansionService";
import { ValidationService } from "./validation/validationService";
import { ApiEventService } from "./misc/apiEventService";
import { PageSizeSelectorComp } from "./pagination/pageSizeSelector/pageSizeSelectorComp";
/**
 * Creates a grid inside the provided HTML element.
 * @param eGridDiv Parent element to contain the grid.
 * @param gridOptions Configuration for the grid.
 * @param params Individually register AG Grid Modules to this grid.
 * @returns api to be used to interact with the grid.
 */
export function createGrid(eGridDiv, gridOptions, params) {
    if (!gridOptions) {
        errorOnce('No gridOptions provided to createGrid');
        return {};
    }
    // Ensure we do not mutate the provided gridOptions
    const shallowCopy = GridOptionsService.getCoercedGridOptions(gridOptions);
    const api = new GridCoreCreator().create(eGridDiv, shallowCopy, context => {
        const gridComp = new GridComp(eGridDiv);
        context.createBean(gridComp);
    }, undefined, params);
    // @deprecated v31 api / columnApi no longer mutated onto the provided gridOptions
    // Instead we place a getter that will log an error when accessed and direct users to the docs
    // Only apply for direct usages of createGrid, not for frameworks
    if (!Object.isFrozen(gridOptions) && !(params === null || params === void 0 ? void 0 : params.frameworkOverrides)) {
        const apiUrl = 'https://zing-grid.com/javascript-data-grid/grid-interface/#grid-api';
        Object.defineProperty(gridOptions, 'api', {
            get: () => {
                errorOnce(`gridOptions.api is no longer supported. See ${apiUrl}.`);
                return undefined;
            },
            configurable: true,
        });
        Object.defineProperty(gridOptions, 'columnApi', {
            get: () => {
                errorOnce(`gridOptions.columnApi is no longer supported and all methods moved to the grid api. See ${apiUrl}.`);
                return undefined;
            },
            configurable: true,
        });
    }
    return api;
}
/**
 * @deprecated v31 use createGrid() instead
 */
export class Grid {
    constructor(eGridDiv, gridOptions, params) {
        warnOnce('Since v31 new Grid(...) is deprecated. Use createGrid instead: `const gridApi = createGrid(...)`. The grid api is returned from createGrid and will not be available on gridOptions.');
        if (!gridOptions) {
            errorOnce('No gridOptions provided to the grid');
            return;
        }
        this.gridOptions = gridOptions;
        const api = new GridCoreCreator().create(eGridDiv, gridOptions, (context) => {
            const gridComp = new GridComp(eGridDiv);
            const bean = context.createBean(gridComp);
            bean.addDestroyFunc(() => {
                this.destroy();
            });
        }, undefined, params);
        // Maintain existing behaviour by mutating gridOptions with the apis for deprecated new Grid()
        this.gridOptions.api = api;
        this.gridOptions.columnApi = new ColumnApi(api);
    }
    destroy() {
        var _a;
        if (this.gridOptions) {
            (_a = this.gridOptions.api) === null || _a === void 0 ? void 0 : _a.destroy();
            // need to remove these, as we don't own the lifecycle of the gridOptions, we need to
            // remove the references in case the user keeps the grid options, we want the rest
            // of the grid to be picked up by the garbage collector
            delete this.gridOptions.api;
            delete this.gridOptions.columnApi;
        }
    }
}
let nextGridId = 1;
// creates services of grid only, no UI, so frameworks can use this if providing
// their own UI
export class GridCoreCreator {
    create(eGridDiv, gridOptions, createUi, acceptChanges, params) {
        var _a;
        // Shallow copy to prevent user provided gridOptions from being mutated.
        const debug = !!gridOptions.debug;
        const gridId = (_a = gridOptions.gridId) !== null && _a !== void 0 ? _a : String(nextGridId++);
        const registeredModules = this.getRegisteredModules(params, gridId);
        const beanClasses = this.createBeansList(gridOptions.rowModelType, registeredModules, gridId);
        const providedBeanInstances = this.createProvidedBeans(eGridDiv, gridOptions, params);
        if (!beanClasses) {
            // Detailed error message will have been printed by createBeansList
            errorOnce('Failed to create grid.');
            // Break typing so that the normal return type does not have to handle undefined.
            return undefined;
        }
        const contextParams = {
            providedBeanInstances: providedBeanInstances,
            beanClasses: beanClasses,
            debug: debug,
            gridId: gridId,
        };
        const contextLogger = new Logger('Context', () => contextParams.debug);
        const context = new Context(contextParams, contextLogger);
        const beans = context.getBean('beans');
        this.registerModuleUserComponents(beans, registeredModules);
        this.registerStackComponents(beans, registeredModules);
        this.registerControllers(beans, registeredModules);
        createUi(context);
        beans.syncService.start();
        if (acceptChanges) {
            acceptChanges(context);
        }
        return beans.gridApi;
    }
    registerControllers(beans, registeredModules) {
        registeredModules.forEach(module => {
            if (module.controllers) {
                module.controllers.forEach(meta => beans.ctrlsFactory.register(meta));
            }
        });
    }
    registerStackComponents(beans, registeredModules) {
        const zingStackComponents = this.createZingStackComponentsList(registeredModules);
        beans.zingStackComponentsRegistry.setupComponents(agStackComponents);
    }
    getRegisteredModules(params, gridId) {
        const passedViaConstructor = params ? params.modules : null;
        const registered = ModuleRegistry.__getRegisteredModules(gridId);
        const allModules = [];
        const mapNames = {};
        // adds to list and removes duplicates
        const addModule = (moduleBased, mod, gridId) => {
            const addIndividualModule = (currentModule) => {
                if (!mapNames[currentModule.moduleName]) {
                    mapNames[currentModule.moduleName] = true;
                    allModules.push(currentModule);
                    ModuleRegistry.__register(currentModule, moduleBased, gridId);
                }
            };
            addIndividualModule(mod);
            if (mod.dependantModules) {
                mod.dependantModules.forEach(m => addModule(moduleBased, m, gridId));
            }
        };
        if (passedViaConstructor) {
            passedViaConstructor.forEach(m => addModule(true, m, gridId));
        }
        if (registered) {
            registered.forEach(m => addModule(!ModuleRegistry.__isPackageBased(), m, undefined));
        }
        return allModules;
    }
    registerModuleUserComponents(beans, registeredModules) {
        const moduleUserComps = this.extractModuleEntity(registeredModules, (module) => module.userComponents ? module.userComponents : []);
        moduleUserComps.forEach(compMeta => {
            beans.userComponentRegistry.registerDefaultComponent(compMeta.componentName, compMeta.componentClass);
        });
    }
    createProvidedBeans(eGridDiv, gridOptions, params) {
        let frameworkOverrides = params ? params.frameworkOverrides : null;
        if (missing(frameworkOverrides)) {
            frameworkOverrides = new VanillaFrameworkOverrides();
        }
        const seed = {
            gridOptions: gridOptions,
            eGridDiv: eGridDiv,
            globalEventListener: params ? params.globalEventListener : null,
            globalSyncEventListener: params ? params.globalSyncEventListener : null,
            frameworkOverrides: frameworkOverrides
        };
        if (params && params.providedBeanInstances) {
            Object.assign(seed, params.providedBeanInstances);
        }
        return seed;
    }
    createZingStackComponentsList(registeredModules) {
        let components = [
            { componentName: 'ZingCheckbox', componentClass: ZingCheckbox },
            { componentName: 'ZingRadioButton', componentClass: ZingRadioButton },
            { componentName: 'ZingToggleButton', componentClass: ZingToggleButton },
            { componentName: 'ZingInputTextField', componentClass: ZingInputTextField },
            { componentName: 'ZingInputTextArea', componentClass: ZingInputTextArea },
            { componentName: 'ZingInputNumberField', componentClass: ZingInputNumberField },
            { componentName: 'ZingInputDateField', componentClass: ZingInputDateField },
            { componentName: 'ZingInputRange', componentClass: ZingInputRange },
            { componentName: 'ZingRichSelect', componentClass: ZingRichSelect },
            { componentName: 'ZingSelect', componentClass: ZingSelect },
            { componentName: 'ZingSlider', componentClass: ZingSlider },
            { componentName: 'ZingGridBody', componentClass: GridBodyComp },
            { componentName: 'ZingHeaderRoot', componentClass: GridHeaderComp },
            { componentName: 'ZingSortIndicator', componentClass: SortIndicatorComp },
            { componentName: 'ZingPagination', componentClass: PaginationComp },
            { componentName: 'ZingPageSizeSelector', componentClass: PageSizeSelectorComp },
            { componentName: 'ZingOverlayWrapper', componentClass: OverlayWrapperComponent },
            { componentName: 'ZingGroupComponent', componentClass: ZingGroupComponent },
            { componentName: 'ZingPanel', componentClass: ZingPanel },
            { componentName: 'ZingDialog', componentClass: ZingDialog },
            { componentName: 'ZingRowContainer', componentClass: RowContainerComp },
            { componentName: 'ZingFakeHorizontalScroll', componentClass: FakeHScrollComp },
            { componentName: 'ZingFakeVerticalScroll', componentClass: FakeVScrollComp },
            { componentName: 'ZingAutocomplete', componentClass: ZingAutocomplete },
        ];
        const moduleZingStackComps = this.extractModuleEntity(registeredModules, (module) => module.zingStackComponents ? module.zingStackComponents : []);
        components = components.concat(moduleZingStackComps);
        return components;
    }
    createBeansList(rowModelType = 'clientSide', registeredModules, gridId) {
        // only load beans matching the required row model
        const rowModelModules = registeredModules.filter(module => !module.rowModel || module.rowModel === rowModelType);
        // assert that the relevant module has been loaded
        const rowModelModuleNames = {
            clientSide: ModuleNames.ClientSideRowModelModule,
            infinite: ModuleNames.InfiniteRowModelModule,
            serverSide: ModuleNames.ServerSideRowModelModule,
            viewport: ModuleNames.ViewportRowModelModule
        };
        if (!rowModelModuleNames[rowModelType]) {
            errorOnce('Could not find row model for rowModelType = ' + rowModelType);
            return;
        }
        if (!ModuleRegistry.__assertRegistered(rowModelModuleNames[rowModelType], `rowModelType = '${rowModelType}'`, gridId)) {
            return;
        }
        // beans should only contain SERVICES, it should NEVER contain COMPONENTS
        const beans = [
            Beans, RowPositionUtils, CellPositionUtils, HeaderPositionUtils,
            PaginationAutoPageSizeService, GridApi, UserComponentRegistry, ZingComponentUtils,
            ComponentMetadataProvider, ResizeObserverService, UserComponentFactory,
            RowContainerHeightService, HorizontalResizeService, LocaleService, ValidationService,
            PinnedRowModel, DragService, DisplayedGroupCreator, EventService, GridOptionsService,
            PopupService, SelectionService, FilterManager, ColumnModel, HeaderNavigationService,
            PaginationProxy, RowRenderer, ExpressionService, ColumnFactory, TemplateService,
            AlignedGridsService, NavigationService, ValueCache, ValueService, LoggerFactory,
            ColumnUtils, AutoWidthCalculator, StandardMenuFactory, DragAndDropService, ColumnApi,
            FocusService, MouseEventService, Environment, CellNavigationService, ValueFormatterService,
            StylingService, ScrollVisibleService, SortController, ColumnHoverService, ColumnAnimationService,
            SelectableService, AutoGroupColService, ChangeDetectionService, AnimationFrameService,
            UndoRedoService, ZingStackComponentsRegistry, ColumnDefFactory,
            RowCssClassCalculator, RowNodeBlockLoader, RowNodeSorter, CtrlsService,
            PinnedWidthService, RowNodeEventThrottle, CtrlsFactory, DataTypeService, ValueParserService,
            QuickFilterService, SyncService, OverlayService, StateService, ExpansionService,
            ApiEventService,
        ];
        const moduleBeans = this.extractModuleEntity(rowModelModules, (module) => module.beans ? module.beans : []);
        beans.push(...moduleBeans);
        // check for duplicates, as different modules could include the same beans that
        // they depend on, eg ClientSideRowModel in enterprise, and ClientSideRowModel in community
        const beansNoDuplicates = [];
        beans.forEach(bean => {
            if (beansNoDuplicates.indexOf(bean) < 0) {
                beansNoDuplicates.push(bean);
            }
        });
        return beansNoDuplicates;
    }
    extractModuleEntity(moduleEntities, extractor) {
        return [].concat(...moduleEntities.map(extractor));
    }
}
//# sourceMappingURL=grid.js.map