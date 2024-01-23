import { Component } from "./component";
export class PopupComponent extends Component {
    isPopup() {
        return true;
    }
    setParentComponent(container) {
        container.addCssClass('zing-has-popup');
        super.setParentComponent(container);
    }
    destroy() {
        const parentComp = this.parentComponent;
        const hasParent = parentComp && parentComp.isAlive();
        if (hasParent) {
            parentComp.getGui().classList.remove('zing-has-popup');
        }
        super.destroy();
    }
}
