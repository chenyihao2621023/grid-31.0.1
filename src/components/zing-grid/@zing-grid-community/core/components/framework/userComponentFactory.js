var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../../context/beanStub";
import { Autowired, Bean, Optional } from "../../context/context";
import { ZingPromise } from "../../utils";
import { mergeDeep } from '../../utils/object';
import { CellEditorComponent, CellRendererComponent, DateComponent, FilterComponent, FloatingFilterComponent, FullWidth, FullWidthDetail, FullWidthGroup, FullWidthLoading, HeaderComponent, HeaderGroupComponent, InnerRendererComponent, LoadingOverlayComponent, NoRowsOverlayComponent, StatusPanelComponent, ToolPanelComponent, TooltipComponent } from "./componentTypes";
import { FloatingFilterMapper } from '../../filter/floating/floatingFilterMapper';
let UserComponentFactory = class UserComponentFactory extends BeanStub {
  getHeaderCompDetails(colDef, params) {
    return this.getCompDetails(colDef, HeaderComponent, 'zingColumnHeader', params);
  }
  getHeaderGroupCompDetails(params) {
    const colGroupDef = params.columnGroup.getColGroupDef();
    return this.getCompDetails(colGroupDef, HeaderGroupComponent, 'zingColumnGroupHeader', params);
  }
  getFullWidthCellRendererDetails(params) {
    return this.getCompDetails(this.gridOptions, FullWidth, null, params, true);
  }
  getFullWidthLoadingCellRendererDetails(params) {
    return this.getCompDetails(this.gridOptions, FullWidthLoading, 'zingLoadingCellRenderer', params, true);
  }
  getFullWidthGroupCellRendererDetails(params) {
    return this.getCompDetails(this.gridOptions, FullWidthGroup, 'zingGroupRowRenderer', params, true);
  }
  getFullWidthDetailCellRendererDetails(params) {
    return this.getCompDetails(this.gridOptions, FullWidthDetail, 'zingDetailCellRenderer', params, true);
  }
  getInnerRendererDetails(def, params) {
    return this.getCompDetails(def, InnerRendererComponent, null, params);
  }
  getFullWidthGroupRowInnerCellRenderer(def, params) {
    return this.getCompDetails(def, InnerRendererComponent, null, params);
  }
  getCellRendererDetails(def, params) {
    return this.getCompDetails(def, CellRendererComponent, null, params);
  }
  getCellEditorDetails(def, params) {
    return this.getCompDetails(def, CellEditorComponent, 'zingCellEditor', params, true);
  }
  getFilterDetails(def, params, defaultFilter) {
    return this.getCompDetails(def, FilterComponent, defaultFilter, params, true);
  }
  getDateCompDetails(params) {
    return this.getCompDetails(this.gridOptions, DateComponent, 'zingDateInput', params, true);
  }
  getLoadingOverlayCompDetails(params) {
    return this.getCompDetails(this.gridOptions, LoadingOverlayComponent, 'zingLoadingOverlay', params, true);
  }
  getNoRowsOverlayCompDetails(params) {
    return this.getCompDetails(this.gridOptions, NoRowsOverlayComponent, 'zingNoRowsOverlay', params, true);
  }
  getTooltipCompDetails(params) {
    return this.getCompDetails(params.colDef, TooltipComponent, 'zingTooltipComponent', params, true);
  }
  getSetFilterCellRendererDetails(def, params) {
    return this.getCompDetails(def, CellRendererComponent, null, params);
  }
  getFloatingFilterCompDetails(def, params, defaultFloatingFilter) {
    return this.getCompDetails(def, FloatingFilterComponent, defaultFloatingFilter, params);
  }
  getToolPanelCompDetails(toolPanelDef, params) {
    return this.getCompDetails(toolPanelDef, ToolPanelComponent, null, params, true);
  }
  getStatusPanelCompDetails(def, params) {
    return this.getCompDetails(def, StatusPanelComponent, null, params, true);
  }
  getCompDetails(defObject, type, defaultName, params, mandatory = false) {
    const {
      propertyName,
      cellRenderer
    } = type;
    let {
      compName,
      jsComp,
      fwComp,
      paramsFromSelector,
      popupFromSelector,
      popupPositionFromSelector
    } = this.getCompKeys(defObject, type, params);
    const lookupFromRegistry = key => {
      const item = this.userComponentRegistry.retrieve(propertyName, key);
      if (item) {
        jsComp = !item.componentFromFramework ? item.component : undefined;
        fwComp = item.componentFromFramework ? item.component : undefined;
      }
    };
    if (compName != null) {
      lookupFromRegistry(compName);
    }
    if (jsComp == null && fwComp == null && defaultName != null) {
      lookupFromRegistry(defaultName);
    }
    if (jsComp && cellRenderer && !this.zingComponentUtils.doesImplementIComponent(jsComp)) {
      jsComp = this.zingComponentUtils.adaptFunction(propertyName, jsComp);
    }
    if (!jsComp && !fwComp) {
      if (mandatory) {
        console.error(`ZING Grid: Could not find component ${compName}, did you forget to configure this component?`);
      }
      return;
    }
    const paramsMerged = this.mergeParamsWithApplicationProvidedParams(defObject, type, params, paramsFromSelector);
    const componentFromFramework = jsComp == null;
    const componentClass = jsComp ? jsComp : fwComp;
    return {
      componentFromFramework,
      componentClass,
      params: paramsMerged,
      type: type,
      popupFromSelector,
      popupPositionFromSelector,
      newZingStackInstance: () => this.newZingStackInstance(componentClass, componentFromFramework, paramsMerged, type)
    };
  }
  getCompKeys(defObject, type, params) {
    const {
      propertyName
    } = type;
    let compName;
    let jsComp;
    let fwComp;
    let paramsFromSelector;
    let popupFromSelector;
    let popupPositionFromSelector;
    if (defObject) {
      const defObjectAny = defObject;
      const selectorFunc = defObjectAny[propertyName + 'Selector'];
      const selectorRes = selectorFunc ? selectorFunc(params) : null;
      const assignComp = providedJsComp => {
        if (typeof providedJsComp === 'string') {
          compName = providedJsComp;
        } else if (providedJsComp != null && providedJsComp !== true) {
          const isFwkComp = this.getFrameworkOverrides().isFrameworkComponent(providedJsComp);
          if (isFwkComp) {
            fwComp = providedJsComp;
          } else {
            jsComp = providedJsComp;
          }
        }
      };
      if (selectorRes) {
        assignComp(selectorRes.component);
        paramsFromSelector = selectorRes.params;
        popupFromSelector = selectorRes.popup;
        popupPositionFromSelector = selectorRes.popupPosition;
      } else {
        assignComp(defObjectAny[propertyName]);
      }
    }
    return {
      compName,
      jsComp,
      fwComp,
      paramsFromSelector,
      popupFromSelector,
      popupPositionFromSelector
    };
  }
  newZingStackInstance(ComponentClass, componentFromFramework, params, type) {
    const propertyName = type.propertyName;
    const jsComponent = !componentFromFramework;
    let instance;
    if (jsComponent) {
      instance = new ComponentClass();
    } else {
      const thisComponentConfig = this.componentMetadataProvider.retrieve(propertyName);
      instance = this.frameworkComponentWrapper.wrap(ComponentClass, thisComponentConfig.mandatoryMethodList, thisComponentConfig.optionalMethodList, type);
    }
    const deferredInit = this.initComponent(instance, params);
    if (deferredInit == null) {
      return ZingPromise.resolve(instance);
    }
    return deferredInit.then(() => instance);
  }
  mergeParamsWithApplicationProvidedParams(defObject, type, paramsFromGrid, paramsFromSelector = null) {
    const params = {
      context: this.gridOptionsService.context,
      columnApi: this.gridOptionsService.columnApi,
      api: this.gridOptionsService.api
    };
    mergeDeep(params, paramsFromGrid);
    const defObjectAny = defObject;
    const userParams = defObjectAny && defObjectAny[type.propertyName + 'Params'];
    if (typeof userParams === 'function') {
      const userParamsFromFunc = userParams(paramsFromGrid);
      mergeDeep(params, userParamsFromFunc);
    } else if (typeof userParams === 'object') {
      mergeDeep(params, userParams);
    }
    mergeDeep(params, paramsFromSelector);
    return params;
  }
  initComponent(component, params) {
    this.context.createBean(component);
    if (component.init == null) {
      return;
    }
    return component.init(params);
  }
  getDefaultFloatingFilterType(def, getFromDefault) {
    if (def == null) {
      return null;
    }
    let defaultFloatingFilterType = null;
    let {
      compName,
      jsComp,
      fwComp
    } = this.getCompKeys(def, FilterComponent);
    if (compName) {
      defaultFloatingFilterType = FloatingFilterMapper.getFloatingFilterType(compName);
    } else {
      const usingDefaultFilter = jsComp == null && fwComp == null && def.filter === true;
      if (usingDefaultFilter) {
        defaultFloatingFilterType = getFromDefault();
      }
    }
    return defaultFloatingFilterType;
  }
};
__decorate([Autowired('gridOptions')], UserComponentFactory.prototype, "gridOptions", void 0);
__decorate([Autowired('zingComponentUtils')], UserComponentFactory.prototype, "zingComponentUtils", void 0);
__decorate([Autowired('componentMetadataProvider')], UserComponentFactory.prototype, "componentMetadataProvider", void 0);
__decorate([Autowired('userComponentRegistry')], UserComponentFactory.prototype, "userComponentRegistry", void 0);
__decorate([Optional('frameworkComponentWrapper')], UserComponentFactory.prototype, "frameworkComponentWrapper", void 0);
UserComponentFactory = __decorate([Bean('userComponentFactory')], UserComponentFactory);
export { UserComponentFactory };