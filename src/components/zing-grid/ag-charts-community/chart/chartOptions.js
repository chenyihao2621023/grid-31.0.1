import { AxisTitle } from './axis/axisTitle';
import { Caption } from './caption';
export const JSON_APPLY_PLUGINS = {
    constructors: {},
    constructedArrays: new WeakMap(),
};
export function assignJsonApplyConstructedArray(array, ctor) {
    var _a;
    (_a = JSON_APPLY_PLUGINS.constructedArrays) === null || _a === void 0 ? void 0 : _a.set(array, ctor);
}
const JSON_APPLY_OPTIONS = {
    constructors: {
        'axes[].title': AxisTitle,
    },
    allowedTypes: {
        'legend.pagination.marker.shape': ['primitive', 'function'],
        'axis[].tick.count': ['primitive', 'class-instance'],
    },
};
export function getJsonApplyOptions(ctx) {
    // Allow context to be injected and meet the type requirements
    class CaptionWithContext extends Caption {
        constructor() {
            super();
            this.registerInteraction(ctx);
        }
    }
    return {
        constructors: Object.assign(Object.assign(Object.assign({}, JSON_APPLY_OPTIONS.constructors), { title: CaptionWithContext, subtitle: CaptionWithContext, footnote: CaptionWithContext }), JSON_APPLY_PLUGINS.constructors),
        constructedArrays: JSON_APPLY_PLUGINS.constructedArrays,
        allowedTypes: Object.assign({}, JSON_APPLY_OPTIONS.allowedTypes),
    };
}
//# sourceMappingURL=chartOptions.js.map