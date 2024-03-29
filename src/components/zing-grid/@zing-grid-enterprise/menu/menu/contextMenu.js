var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, ZingMenuItemComponent, ZingMenuList, Autowired, Bean, BeanStub, Component, ModuleNames, ModuleRegistry, Optional, PostConstruct } from "@/components/zing-grid/@zing-grid-community/core/main.js";
const CSS_MENU = 'zing-menu';
const CSS_CONTEXT_MENU_OPEN = 'zing-context-menu-open';
let ContextMenuFactory = class ContextMenuFactory extends BeanStub {
  hideActiveMenu() {
    this.destroyBean(this.activeMenu);
  }
  getMenuItems(node, column, value) {
    const defaultMenuOptions = [];
    if (_.exists(node) && ModuleRegistry.__isRegistered(ModuleNames.ClipboardModule, this.context.getGridId())) {
      if (column) {
        if (!this.gridOptionsService.get('suppressCutToClipboard')) {
          defaultMenuOptions.push('cut');
        }
        defaultMenuOptions.push('copy', 'copyWithHeaders', 'copyWithGroupHeaders', 'paste', 'separator');
      }
    }
    if (this.gridOptionsService.get('enableCharts') && ModuleRegistry.__isRegistered(ModuleNames.GridChartsModule, this.context.getGridId())) {
      if (this.columnModel.isPivotMode()) {
        defaultMenuOptions.push('pivotChart');
      }
      if (this.rangeService && !this.rangeService.isEmpty()) {
        defaultMenuOptions.push('chartRange');
      }
    }
    if (_.exists(node)) {
      const csvModuleMissing = !ModuleRegistry.__isRegistered(ModuleNames.CsvExportModule, this.context.getGridId());
      const excelModuleMissing = !ModuleRegistry.__isRegistered(ModuleNames.ExcelExportModule, this.context.getGridId());
      const suppressExcel = this.gridOptionsService.get('suppressExcelExport') || excelModuleMissing;
      const suppressCsv = this.gridOptionsService.get('suppressCsvExport') || csvModuleMissing;
      const onIPad = _.isIOSUserAgent();
      const anyExport = !onIPad && (!suppressExcel || !suppressCsv);
      if (anyExport) {
        defaultMenuOptions.push('export');
      }
    }
    const userFunc = this.gridOptionsService.getCallback('getContextMenuItems');
    if (userFunc) {
      const params = {
        node: node,
        column: column,
        value: value,
        defaultItems: defaultMenuOptions.length ? defaultMenuOptions : undefined
      };
      return userFunc(params);
    }
    return defaultMenuOptions;
  }
  onContextMenu(mouseEvent, touchEvent, rowNode, column, value, anchorToElement) {
    if (!this.gridOptionsService.get('allowContextMenuWithControlKey')) {
      if (mouseEvent && (mouseEvent.ctrlKey || mouseEvent.metaKey)) {
        return;
      }
    }
    if (mouseEvent) {
      this.blockMiddleClickScrollsIfNeeded(mouseEvent);
    }
    if (this.gridOptionsService.get('suppressContextMenu')) {
      return;
    }
    const eventOrTouch = mouseEvent ? mouseEvent : touchEvent.touches[0];
    if (this.showMenu(rowNode, column, value, eventOrTouch, anchorToElement)) {
      const event = mouseEvent ? mouseEvent : touchEvent;
      event.preventDefault();
    }
  }
  blockMiddleClickScrollsIfNeeded(mouseEvent) {
    const {
      gridOptionsService
    } = this;
    const {
      which
    } = mouseEvent;
    if (gridOptionsService.get('suppressMiddleClickScrolls') && which === 2) {
      mouseEvent.preventDefault();
    }
  }
  showMenu(node, column, value, mouseEvent, anchorToElement) {
    const menuItems = this.getMenuItems(node, column, value);
    const eGridBodyGui = this.ctrlsService.getGridBodyCtrl().getGui();
    if (menuItems === undefined || _.missingOrEmpty(menuItems)) {
      return false;
    }
    const menu = new ContextMenu(menuItems);
    this.createBean(menu);
    const eMenuGui = menu.getGui();
    const positionParams = {
      column: column,
      rowNode: node,
      type: 'contextMenu',
      mouseEvent: mouseEvent,
      ePopup: eMenuGui,
      nudgeY: 1
    };
    const translate = this.localeService.getLocaleTextFunc();
    const addPopupRes = this.popupService.addPopup({
      modal: true,
      eChild: eMenuGui,
      closeOnEsc: true,
      closedCallback: () => {
        eGridBodyGui.classList.remove(CSS_CONTEXT_MENU_OPEN);
        this.destroyBean(menu);
      },
      click: mouseEvent,
      positionCallback: () => {
        const isRtl = this.gridOptionsService.get('enableRtl');
        this.popupService.positionPopupUnderMouseEvent(Object.assign(Object.assign({}, positionParams), {
          nudgeX: isRtl ? (eMenuGui.offsetWidth + 1) * -1 : 1
        }));
      },
      anchorToElement: anchorToElement,
      ariaLabel: translate('ariaLabelContextMenu', 'Context Menu')
    });
    if (addPopupRes) {
      eGridBodyGui.classList.add(CSS_CONTEXT_MENU_OPEN);
      menu.afterGuiAttached({
        container: 'contextMenu',
        hidePopup: addPopupRes.hideFunc
      });
    }
    if (this.activeMenu) {
      this.hideActiveMenu();
    }
    this.activeMenu = menu;
    menu.addEventListener(BeanStub.EVENT_DESTROYED, () => {
      if (this.activeMenu === menu) {
        this.activeMenu = null;
      }
    });
    if (addPopupRes) {
      menu.addEventListener(ZingMenuItemComponent.EVENT_MENU_ITEM_SELECTED, addPopupRes.hideFunc);
    }
    return true;
  }
};
__decorate([Autowired('popupService')], ContextMenuFactory.prototype, "popupService", void 0);
__decorate([Optional('rangeService')], ContextMenuFactory.prototype, "rangeService", void 0);
__decorate([Autowired('ctrlsService')], ContextMenuFactory.prototype, "ctrlsService", void 0);
__decorate([Autowired('columnModel')], ContextMenuFactory.prototype, "columnModel", void 0);
ContextMenuFactory = __decorate([Bean('contextMenuFactory')], ContextMenuFactory);
export { ContextMenuFactory };
class ContextMenu extends Component {
  constructor(menuItems) {
    super(`<div class="${CSS_MENU}" role="presentation"></div>`);
    this.menuList = null;
    this.focusedCell = null;
    this.menuItems = menuItems;
  }
  addMenuItems() {
    const menuList = this.createManagedBean(new ZingMenuList());
    const menuItemsMapped = this.menuItemMapper.mapWithStockItems(this.menuItems, null);
    menuList.addMenuItems(menuItemsMapped);
    this.appendChild(menuList);
    this.menuList = menuList;
    menuList.addEventListener(ZingMenuItemComponent.EVENT_MENU_ITEM_SELECTED, e => this.dispatchEvent(e));
  }
  afterGuiAttached(params) {
    if (params.hidePopup) {
      this.addDestroyFunc(params.hidePopup);
    }
    this.focusedCell = this.focusService.getFocusedCell();
    if (this.menuList) {
      this.focusService.focusInto(this.menuList.getGui());
    }
  }
  restoreFocusedCell() {
    const currentFocusedCell = this.focusService.getFocusedCell();
    if (currentFocusedCell && this.focusedCell && this.cellPositionUtils.equals(currentFocusedCell, this.focusedCell)) {
      const {
        rowIndex,
        rowPinned,
        column
      } = this.focusedCell;
      const doc = this.gridOptionsService.getDocument();
      if (doc.activeElement === doc.body) {
        this.focusService.setFocusedCell({
          rowIndex,
          column,
          rowPinned,
          forceBrowserFocus: true
        });
      }
    }
  }
  destroy() {
    this.restoreFocusedCell();
    super.destroy();
  }
}
__decorate([Autowired('menuItemMapper')], ContextMenu.prototype, "menuItemMapper", void 0);
__decorate([Autowired('focusService')], ContextMenu.prototype, "focusService", void 0);
__decorate([Autowired('cellPositionUtils')], ContextMenu.prototype, "cellPositionUtils", void 0);
__decorate([PostConstruct], ContextMenu.prototype, "addMenuItems", null);