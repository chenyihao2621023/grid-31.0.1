import { ZingRichSelect, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class SelectPillComp extends ZingRichSelect {
    constructor(params) {
        super(Object.assign(Object.assign({}, params), { template: /* html */ `
                <div class="zing-picker-field zing-advanced-filter-builder-pill-wrapper" role="presentation">
                    <div ref="eLabel"></div>
                    <div ref="eWrapper" class="zing-wrapper zing-advanced-filter-builder-pill zing-picker-collapsed">
                        <div ref="eDisplayField" class="zing-picker-field-display zing-advanced-filter-builder-pill-display"></div>
                        <zing-input-text-field ref="eInput" class="zing-rich-select-field-input"></zing-input-text-field>
                        <div ref="eIcon" class="zing-picker-field-icon" aria-hidden="true"></div>
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
        _.stopPropagationForZingGrid(event);
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