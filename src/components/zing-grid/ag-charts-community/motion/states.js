import { Debug } from '../util/debug';
export class StateMachine {
    constructor(initialState, states, preTransitionCb) {
        this.states = states;
        this.preTransitionCb = preTransitionCb;
        this.debug = Debug.create(true, 'animation');
        this.state = initialState;
        this.debug(`%c${this.constructor.name} | init -> ${initialState}`, 'color: green');
    }
    transition(event, data) {
        var _a, _b;
        const currentStateConfig = this.states[this.state];
        const destinationTransition = currentStateConfig === null || currentStateConfig === void 0 ? void 0 : currentStateConfig[event];
        if (!destinationTransition) {
            this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.state}`, 'color: grey');
            return;
        }
        let destinationState = this.state;
        if (typeof destinationTransition === 'string') {
            destinationState = destinationTransition;
        }
        else if (typeof destinationTransition === 'object') {
            destinationState = destinationTransition.target;
        }
        this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${destinationState}`, 'color: green');
        (_a = this.preTransitionCb) === null || _a === void 0 ? void 0 : _a.call(this, this.state, destinationState);
        // Change the state before calling the transition action to allow the action to trigger a subsequent transition
        this.state = destinationState;
        if (typeof destinationTransition === 'function') {
            destinationTransition(data);
        }
        else if (typeof destinationTransition === 'object') {
            (_b = destinationTransition.action) === null || _b === void 0 ? void 0 : _b.call(destinationTransition, data);
        }
        return this.state;
    }
}
//# sourceMappingURL=states.js.map