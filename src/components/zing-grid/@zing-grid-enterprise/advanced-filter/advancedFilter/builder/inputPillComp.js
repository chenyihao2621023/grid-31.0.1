var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ZingInputDateField, ZingInputNumberField, ZingInputTextField, Autowired, Component, Events, KeyCode, PostConstruct, RefSelector, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class InputPillComp extends Component {
    constructor(params) {
        super(/* html */ `
            <div class="ag-advanced-filter-builder-pill-wrapper" role="presentation">
                <div ref="ePill" class="ag-advanced-filter-builder-pill" role="button">
                    <span ref="eLabel" class="ag-advanced-filter-builder-pill-display"></span>
                </div>
            </div>
        `);
        this.params = params;
        this.value = params.value;
    }
    postConstruct() {
        const { cssClass, ariaLabel } = this.params;
        this.ePill.classList.add(cssClass);
        this.activateTabIndex([this.ePill]);
        this.eLabel.id = `${this.getCompId()}`;
        _.setAriaDescribedBy(this.ePill, this.eLabel.id);
        _.setAriaLabel(this.ePill, ariaLabel);
        this.renderValue();
        this.addManagedListener(this.ePill, 'click', (event) => {
            event.preventDefault();
            this.showEditor();
        });
        this.addManagedListener(this.ePill, 'keydown', (event) => {
            switch (event.key) {
                case KeyCode.ENTER:
                    event.preventDefault();
                    _.stopPropagationForAgGrid(event);
                    this.showEditor();
                    break;
            }
        });
        this.addDestroyFunc(() => this.destroyBean(this.eEditor));
    }
    getFocusableElement() {
        return this.ePill;
    }
    showEditor() {
        if (this.eEditor) {
            return;
        }
        _.setDisplayed(this.ePill, false);
        this.eEditor = this.createEditorComp(this.params.type);
        this.eEditor.setValue(this.value);
        const eEditorGui = this.eEditor.getGui();
        this.eEditor.addManagedListener(eEditorGui, 'keydown', (event) => {
            switch (event.key) {
                case KeyCode.ENTER:
                    event.preventDefault();
                    _.stopPropagationForAgGrid(event);
                    this.updateValue(true);
                    break;
                case KeyCode.ESCAPE:
                    event.preventDefault();
                    _.stopPropagationForAgGrid(event);
                    this.hideEditor(true);
                    break;
            }
        });
        this.eEditor.addManagedListener(eEditorGui, 'focusout', () => {
            this.updateValue(false);
        });
        this.getGui().appendChild(eEditorGui);
        this.eEditor.getFocusableElement().focus();
    }
    createEditorComp(type) {
        let comp;
        switch (type) {
            case 'text':
                comp = new ZingInputTextField();
                break;
            case 'number':
                comp = new ZingInputNumberField();
                break;
            case 'date':
                comp = new ZingInputDateField();
                break;
        }
        return this.createBean(comp);
    }
    hideEditor(keepFocus) {
        const { eEditor } = this;
        if (!eEditor) {
            return;
        }
        this.eEditor = undefined;
        this.getGui().removeChild(eEditor.getGui());
        this.destroyBean(eEditor);
        _.setDisplayed(this.ePill, true);
        if (keepFocus) {
            this.ePill.focus();
        }
    }
    renderValue() {
        let value;
        this.eLabel.classList.remove('ag-advanced-filter-builder-value-empty', 'ag-advanced-filter-builder-value-number', 'ag-advanced-filter-builder-value-text');
        if (!_.exists(this.value)) {
            value = this.advancedFilterExpressionService.translate('advancedFilterBuilderEnterValue');
            this.eLabel.classList.add('ag-advanced-filter-builder-value-empty');
        }
        else if (this.params.type === 'number') {
            value = this.value;
            this.eLabel.classList.add('ag-advanced-filter-builder-value-number');
        }
        else {
            value = `"${this.value}"`;
            this.eLabel.classList.add('ag-advanced-filter-builder-value-text');
        }
        this.eLabel.innerText = value;
    }
    updateValue(keepFocus) {
        var _a;
        if (!this.eEditor) {
            return;
        }
        const value = (_a = this.eEditor.getValue()) !== null && _a !== void 0 ? _a : '';
        this.dispatchEvent({
            type: Events.EVENT_FIELD_VALUE_CHANGED,
            value
        });
        this.value = value;
        this.renderValue();
        this.hideEditor(keepFocus);
    }
}
__decorate([
    RefSelector('ePill')
], InputPillComp.prototype, "ePill", void 0);
__decorate([
    RefSelector('eLabel')
], InputPillComp.prototype, "eLabel", void 0);
__decorate([
    Autowired('advancedFilterExpressionService')
], InputPillComp.prototype, "advancedFilterExpressionService", void 0);
__decorate([
    PostConstruct
], InputPillComp.prototype, "postConstruct", null);
//# sourceMappingURL=inputPillComp.js.map