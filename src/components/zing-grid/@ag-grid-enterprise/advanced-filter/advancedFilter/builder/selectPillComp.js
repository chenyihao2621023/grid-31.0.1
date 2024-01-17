import { AgRichSelect, _ } from "@/components/zing-grid/@ag-grid-community/core/main.js";
export class SelectPillComp extends AgRichSelect {
    constructor(params) {
        super(Object.assign(Object.assign({}, params), { template: /* html */ `
                <div class="ag-picker-field ag-advanced-filter-builder-pill-wrapper" role="presentation">
                    <div ref="eLabel"></div>
                    <div ref="eWrapper" class="ag-wrapper ag-advanced-filter-builder-pill ag-picker-collapsed">
                        <div ref="eDisplayField" class="ag-picker-field-display ag-advanced-filter-builder-pill-display"></div>
                        <ag-input-text-field ref="eInput" class="ag-rich-select-field-input"></ag-input-text-field>
                        <div ref="eIcon" class="ag-picker-field-icon" aria-hidden="true"></div>
                    </div>
                </div>` }));
        this.params = params;
    }
    getFocusableElement() {
        return this.eWrapper;
    }
    showPicker() {
        // avoid focus handling issues with multiple rich selects
        setTimeout(() => super.showPicker());
    }
    hidePicker() {
        // avoid focus handling issues with multiple rich selects
        setTimeout(() => super.hidePicker());
    }
    postConstruct() {
        super.postConstruct();
        const { wrapperClassName, ariaLabel } = this.params;
        this.eWrapper.classList.add(wrapperClassName);
        _.setAriaLabelledBy(this.eWrapper, '');
        _.setAriaLabel(this.eWrapper, ariaLabel);
    }
    createPickerComponent() {
        var _a;
        if (!this.values) {
            const { values } = this.params.getEditorParams();
            this.values = values;
            const key = this.value.key;
            const value = (_a = values.find(value => value.key === key)) !== null && _a !== void 0 ? _a : {
                key,
                displayValue: this.value.displayValue
            };
            this.value = value;
        }
        return super.createPickerComponent();
    }
    onEnterKeyDown(event) {
        _.stopPropagationForAgGrid(event);
        if (this.isPickerDisplayed) {
            super.onEnterKeyDown(event);
        }
        else {
            event.preventDefault();
            this.showPicker();
        }
    }
}
//# sourceMappingURL=selectPillComp.js.map