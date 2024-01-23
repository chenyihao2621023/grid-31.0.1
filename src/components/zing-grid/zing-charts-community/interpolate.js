import { Color } from './util/color';
export function interpolateNumber(a, b) {
    return (d) => Number(a) * (1 - d) + Number(b) * d;
}
export function interpolateColor(a, b) {
    if (typeof a === 'string') {
        try {
            a = Color.fromString(a);
        }
        catch (e) {
            a = Color.fromArray([0, 0, 0]);
        }
    }
    if (typeof b === 'string') {
        try {
            b = Color.fromString(b);
        }
        catch (e) {
            b = Color.fromArray([0, 0, 0]);
        }
    }
    const red = interpolateNumber(a.r, b.r);
    const green = interpolateNumber(a.g, b.g);
    const blue = interpolateNumber(a.b, b.b);
    const alpha = interpolateNumber(a.a, b.a);
    return (d) => Color.fromArray([red(d), green(d), blue(d), alpha(d)]).toRgbaString();
}
