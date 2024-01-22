var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../../context/beanStub";
import { Autowired, Bean, PostConstruct } from "../../context/context";
import { ReadOnlyFloatingFilter } from "../../filter/floating/provided/readOnlyFloatingFilter";
import { DateFilter } from "../../filter/provided/date/dateFilter";
import { DateFloatingFilter } from "../../filter/provided/date/dateFloatingFilter";
import { DefaultDateComponent } from "../../filter/provided/date/defaultDateComponent";
import { NumberFilter } from "../../filter/provided/number/numberFilter";
import { NumberFloatingFilter } from "../../filter/provided/number/numberFloatingFilter";
import { TextFilter } from "../../filter/provided/text/textFilter";
import { TextFloatingFilter } from "../../filter/provided/text/textFloatingFilter";
import { HeaderComp } from "../../headerRendering/cells/column/headerComp";
import { SortIndicatorComp } from "../../headerRendering/cells/column/sortIndicatorComp";
import { HeaderGroupComp } from "../../headerRendering/cells/columnGroup/headerGroupComp";
import { ModuleNames } from "../../modules/moduleNames";
import { ModuleRegistry } from "../../modules/moduleRegistry";
import { LargeTextCellEditor } from "../../rendering/cellEditors/largeTextCellEditor";
import { SelectCellEditor } from "../../rendering/cellEditors/selectCellEditor";
import { TextCellEditor } from "../../rendering/cellEditors/textCellEditor";
import { AnimateShowChangeCellRenderer } from "../../rendering/cellRenderers/animateShowChangeCellRenderer";
import { AnimateSlideCellRenderer } from "../../rendering/cellRenderers/animateSlideCellRenderer";
import { GroupCellRenderer } from "../../rendering/cellRenderers/groupCellRenderer";
import { LoadingCellRenderer } from "../../rendering/cellRenderers/loadingCellRenderer";
import { LoadingOverlayComponent } from "../../rendering/overlays/loadingOverlayComponent";
import { NoRowsOverlayComponent } from "../../rendering/overlays/noRowsOverlayComponent";
import { TooltipComponent } from "../../rendering/tooltipComponent";
import { doOnce } from "../../utils/function";
import { iterateObject } from '../../utils/object';
import { fuzzySuggestions } from '../../utils/fuzzyMatch';
import { NumberCellEditor } from "../../rendering/cellEditors/numberCellEditor";
import { DateCellEditor } from "../../rendering/cellEditors/dateCellEditor";
import { DateStringCellEditor } from "../../rendering/cellEditors/dateStringCellEditor";
import { CheckboxCellRenderer } from "../../rendering/cellRenderers/checkboxCellRenderer";
import { CheckboxCellEditor } from "../../rendering/cellEditors/checkboxCellEditor";
let UserComponentRegistry = class UserComponentRegistry extends BeanStub {
    constructor() {
        super(...arguments);
        this.zingGridDefaults = {
            //date
            zingDateInput: DefaultDateComponent,
            //header
            zingColumnHeader: HeaderComp,
            zingColumnGroupHeader: HeaderGroupComp,
            zingSortIndicator: SortIndicatorComp,
            //floating filters
            zingTextColumnFloatingFilter: TextFloatingFilter,
            zingNumberColumnFloatingFilter: NumberFloatingFilter,
            zingDateColumnFloatingFilter: DateFloatingFilter,
            zingReadOnlyFloatingFilter: ReadOnlyFloatingFilter,
            // renderers
            zingAnimateShowChangeCellRenderer: AnimateShowChangeCellRenderer,
            zingAnimateSlideCellRenderer: AnimateSlideCellRenderer,
            zingGroupCellRenderer: GroupCellRenderer,
            zingGroupRowRenderer: GroupCellRenderer,
            zingLoadingCellRenderer: LoadingCellRenderer,
            zingCheckboxCellRenderer: CheckboxCellRenderer,
            //editors
            zingCellEditor: TextCellEditor,
            zingTextCellEditor: TextCellEditor,
            zingNumberCellEditor: NumberCellEditor,
            zingDateCellEditor: DateCellEditor,
            zingDateStringCellEditor: DateStringCellEditor,
            zingSelectCellEditor: SelectCellEditor,
            zingLargeTextCellEditor: LargeTextCellEditor,
            zingCheckboxCellEditor: CheckboxCellEditor,
            //filter
            zingTextColumnFilter: TextFilter,
            zingNumberColumnFilter: NumberFilter,
            zingDateColumnFilter: DateFilter,
            //overlays
            zingLoadingOverlay: LoadingOverlayComponent,
            zingNoRowsOverlay: NoRowsOverlayComponent,
            // tooltips
            zingTooltipComponent: TooltipComponent
        };
        /** Used to provide useful error messages if a user is trying to use an enterprise component without loading the module. */
        this.enterpriseZingDefaultCompsModule = {
            zingSetColumnFilter: ModuleNames.SetFilterModule,
            zingSetColumnFloatingFilter: ModuleNames.SetFilterModule,
            zingMultiColumnFilter: ModuleNames.MultiFilterModule,
            zingMultiColumnFloatingFilter: ModuleNames.MultiFilterModule,
            zingGroupColumnFilter: ModuleNames.RowGroupingModule,
            zingGroupColumnFloatingFilter: ModuleNames.RowGroupingModule,
            zingRichSelect: ModuleNames.RichSelectModule,
            zingRichSelectCellEditor: ModuleNames.RichSelectModule,
            zingDetailCellRenderer: ModuleNames.MasterDetailModule,
            zingSparklineCellRenderer: ModuleNames.SparklinesModule
        };
        this.jsComps = {};
    }
    init() {
        if (this.gridOptions.components != null) {
            iterateObject(this.gridOptions.components, (key, component) => this.registerJsComponent(key, component));
        }
    }
    registerDefaultComponent(name, component) {
        if (this.zingGridDefaults[name]) {
            console.error(`Trying to overwrite a default component. You should call registerComponent`);
            return;
        }
        this.zingGridDefaults[name] = component;
    }
    registerJsComponent(name, component) {
        this.jsComps[name] = component;
    }
    retrieve(propertyName, name) {
        const createResult = (component, componentFromFramework) => ({ componentFromFramework, component });
        // FrameworkOverrides.frameworkComponent() is used in two locations:
        // 1) for Vue, user provided components get registered via a framework specific way.
        // 2) for React, it's how the React UI provides alternative default components (eg GroupCellRenderer and DetailCellRenderer)
        const registeredViaFrameworkComp = this.getFrameworkOverrides().frameworkComponent(name, this.gridOptions.components);
        if (registeredViaFrameworkComp != null) {
            return createResult(registeredViaFrameworkComp, true);
        }
        const jsComponent = this.jsComps[name];
        if (jsComponent) {
            const isFwkComp = this.getFrameworkOverrides().isFrameworkComponent(jsComponent);
            return createResult(jsComponent, isFwkComp);
        }
        const defaultComponent = this.zingGridDefaults[name];
        if (defaultComponent) {
            return createResult(defaultComponent, false);
        }
        const moduleForComponent = this.enterpriseZingDefaultCompsModule[name];
        if (moduleForComponent) {
            ModuleRegistry.__assertRegistered(moduleForComponent, `ZING Grid '${propertyName}' component: ${name}`, this.context.getGridId());
        }
        else {
            doOnce(() => { this.warnAboutMissingComponent(propertyName, name); }, "MissingComp" + name);
        }
        return null;
    }
    warnAboutMissingComponent(propertyName, componentName) {
        const validComponents = [
            // Don't include the old names / internals in potential suggestions
            ...Object.keys(this.zingGridDefaults).filter(k => !['zingCellEditor', 'zingGroupRowRenderer', 'zingSortIndicator'].includes(k)),
            ...Object.keys(this.jsComps)
        ];
        const suggestions = fuzzySuggestions(componentName, validComponents, true, 0.8).values;
        console.warn(`ZING Grid: Could not find '${componentName}' component. It was configured as "${propertyName}: '${componentName}'" but it wasn't found in the list of registered components.`);
        if (suggestions.length > 0) {
            console.warn(`         Did you mean: [${suggestions.slice(0, 3)}]?`);
        }
        console.warn(`If using a custom component check it has been registered as described in: ${this.getFrameworkOverrides().getDocLink('components/')}`);
    }
};
__decorate([
    Autowired('gridOptions')
], UserComponentRegistry.prototype, "gridOptions", void 0);
__decorate([
    PostConstruct
], UserComponentRegistry.prototype, "init", null);
UserComponentRegistry = __decorate([
    Bean('userComponentRegistry')
], UserComponentRegistry);
export { UserComponentRegistry };
//# sourceMappingURL=userComponentRegistry.js.map