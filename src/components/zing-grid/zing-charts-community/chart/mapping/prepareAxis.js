const CARTESIAN_AXIS_POSITIONS = ['top', 'right', 'bottom', 'left'];
const CARTESIAN_AXIS_TYPES = ['category', 'grouped-category', 'number', 'log', 'time'];
function hasCartesianAxisPosition(axis) {
    const allowedTypes = CARTESIAN_AXIS_TYPES;
    return allowedTypes.includes(axis.type);
}
function isCartesianAxisOptions(options) {
    const allowedTypes = CARTESIAN_AXIS_TYPES;
    return allowedTypes.includes(options.type);
}
function isAxisPosition(position) {
    const allowedPositions = CARTESIAN_AXIS_POSITIONS;
    return typeof position === 'string' && allowedPositions.includes(position);
}
// If axis[].position, then we cannot always default to the same value. We need
// to default to an 'untaken' position (see AG-9963 for more info).
export class AxisPositionGuesser {
    constructor() {
        this.result = [];
        this.valid = [];
        this.invalid = [];
    }
    push(axis, options) {
        const { result, valid, invalid } = this;
        if (isCartesianAxisOptions(options)) {
            if (isAxisPosition(options.position)) {
                valid.push(axis);
            }
            else {
                invalid.push(axis);
            }
        }
        result.push(axis);
    }
    guessInvalidPositions() {
        const takenPosition = this.valid
            .filter((v) => hasCartesianAxisPosition(v))
            .map((v) => v.position)
            .filter((v) => v !== undefined);
        const guesses = ['top', 'right', 'bottom', 'left'];
        for (const invalidAxis of this.invalid) {
            let nextGuess = guesses.pop();
            while (takenPosition.includes(nextGuess) && nextGuess !== undefined) {
                nextGuess = guesses.pop();
            }
            if (nextGuess === undefined)
                break;
            invalidAxis.position = nextGuess;
        }
        return this.result;
    }
}
