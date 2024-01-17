import { _Scene } from '@/components/zing-grid/ag-charts-community/main.js';
export function getMarker(shape) {
    switch (shape) {
        case 'circle':
            return _Scene.Circle;
        case 'square':
            return _Scene.Square;
        case 'diamond':
            return _Scene.Diamond;
        default:
            return _Scene.Circle;
    }
}
//# sourceMappingURL=markerFactory.js.map