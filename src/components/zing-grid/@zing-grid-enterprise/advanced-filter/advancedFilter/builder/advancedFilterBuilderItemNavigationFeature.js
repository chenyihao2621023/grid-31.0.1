var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub, KeyCode, PostConstruct, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class AdvancedFilterBuilderItemNavigationFeature extends BeanStub {
    constructor(eGui, focusWrapper, eFocusableComp) {
        super();
        this.eGui = eGui;
        this.focusWrapper = focusWrapper;
        this.eFocusableComp = eFocusableComp;
    }
    postConstruct() {
        this.addManagedListener(this.eGui, 'keydown', (event) => {
            switch (event.key) {
                case KeyCode.TAB:
                    if (!event.defaultPrevented) {
                        // tab guard handled the navigation. stop from reaching virtual list
                        _.stopPropagationForZingGrid(event);
                    }
                    break;
                case KeyCode.UP:
                case KeyCode.DOWN:
                    // if this hasn't been handled by an editor, prevent virtual list navigation
                    _.stopPropagationForZingGrid(event);
                    break;
                case KeyCode.ESCAPE:
                    if (_.isStopPropagationForZingGrid(event)) {
                        return;
                    }
                    const eDocument = this.gridOptionsService.getDocument();
                    if (this.eGui.contains(eDocument.activeElement)) {
                        event.preventDefault();
                        _.stopPropagationForZingGrid(event);
                        this.focusWrapper.focus();
                    }
                    break;
            }
        });
        this.addManagedListener(this.focusWrapper, 'keydown', (event) => {
            switch (event.key) {
                case KeyCode.ENTER:
                    if (_.isStopPropagationForZingGrid(event)) {
                        return;
                    }
                    const eDocument = this.gridOptionsService.getDocument();
                    if (eDocument.activeElement === this.focusWrapper) {
                        event.preventDefault();
                        _.stopPropagationForZingGrid(event);
                        this.eFocusableComp.getFocusableElement().focus();
                    }
                    break;
            }
        });
        this.addManagedListener(this.focusWrapper, 'focusin', () => {
            this.focusWrapper.classList.add('zing-advanced-filter-builder-virtual-list-item-highlight');
        });
        this.addManagedListener(this.focusWrapper, 'focusout', (event) => {
            if (!this.focusWrapper.contains(event.relatedTarget)) {
                this.focusWrapper.classList.remove('zing-advanced-filter-builder-virtual-list-item-highlight');
            }
        });
    }
}
__decorate([
    PostConstruct
], AdvancedFilterBuilderItemNavigationFeature.prototype, "postConstruct", null);
//# sourceMappingURL=advancedFilterBuilderItemNavigationFeature.js.map