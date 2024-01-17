import { _Util } from "@/components/zing-grid/ag-charts-community/main.js";
// import { _Util } from "ag-charts-enterprise";
export function hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgba(${r}, ${g}, ${b})`;
}
export function changeOpacity(fills, alpha) {
    return fills.map(fill => {
        const c = _Util.Color.fromString(fill);
        return new _Util.Color(c.r, c.g, c.b, alpha).toHexString();
    });
}
//# sourceMappingURL=color.js.map