;
;
export function findMatch(searchValue, values, getDisplayValue) {
  let partialMatch = false;
  const searchValueLowerCase = searchValue.toLocaleLowerCase();
  const partialSearchValue = searchValueLowerCase + ' ';
  const parsedValue = Object.entries(values).find(([_key, value]) => {
    const displayValueLowerCase = getDisplayValue(value).toLocaleLowerCase();
    if (displayValueLowerCase.startsWith(partialSearchValue)) {
      partialMatch = true;
    }
    return displayValueLowerCase === searchValueLowerCase;
  });
  if (parsedValue) {
    return parsedValue[0];
  } else if (partialMatch) {
    return null;
  } else {
    return undefined;
  }
}
function getEntries(operators, activeOperatorKeys) {
  const keys = activeOperatorKeys !== null && activeOperatorKeys !== void 0 ? activeOperatorKeys : Object.keys(operators);
  return keys.map(key => ({
    key,
    displayValue: operators[key].displayValue
  }));
}
export class TextFilterExpressionOperators {
  constructor(params) {
    this.params = params;
    this.initOperators();
  }
  getEntries(activeOperators) {
    return getEntries(this.operators, activeOperators);
  }
  findOperator(displayValue) {
    return findMatch(displayValue, this.operators, ({
      displayValue
    }) => displayValue);
  }
  initOperators() {
    const {
      translate
    } = this.params;
    this.operators = {
      contains: {
        displayValue: translate('advancedFilterContains'),
        evaluator: (value, node, params, operand1) => this.evaluateExpression(value, node, params, operand1, false, (v, o) => v.includes(o)),
        numOperands: 1
      },
      notContains: {
        displayValue: translate('advancedFilterNotContains'),
        evaluator: (value, node, params, operand1) => this.evaluateExpression(value, node, params, operand1, true, (v, o) => !v.includes(o)),
        numOperands: 1
      },
      equals: {
        displayValue: translate('advancedFilterTextEquals'),
        evaluator: (value, node, params, operand1) => this.evaluateExpression(value, node, params, operand1, false, (v, o) => v === o),
        numOperands: 1
      },
      notEqual: {
        displayValue: translate('advancedFilterTextNotEqual'),
        evaluator: (value, node, params, operand1) => this.evaluateExpression(value, node, params, operand1, true, (v, o) => v != o),
        numOperands: 1
      },
      startsWith: {
        displayValue: translate('advancedFilterStartsWith'),
        evaluator: (value, node, params, operand1) => this.evaluateExpression(value, node, params, operand1, false, (v, o) => v.startsWith(o)),
        numOperands: 1
      },
      endsWith: {
        displayValue: translate('advancedFilterEndsWith'),
        evaluator: (value, node, params, operand1) => this.evaluateExpression(value, node, params, operand1, false, (v, o) => v.endsWith(o)),
        numOperands: 1
      },
      blank: {
        displayValue: translate('advancedFilterBlank'),
        evaluator: value => value == null || typeof value === 'string' && value.trim().length === 0,
        numOperands: 0
      },
      notBlank: {
        displayValue: translate('advancedFilterNotBlank'),
        evaluator: value => value != null && (typeof value !== 'string' || value.trim().length > 0),
        numOperands: 0
      }
    };
  }
  evaluateExpression(value, node, params, operand, nullsMatch, expression) {
    if (value == null) {
      return nullsMatch;
    }
    return params.caseSensitive ? expression(params.valueConverter(value, node), operand) : expression(params.valueConverter(value, node).toLocaleLowerCase(), operand.toLocaleLowerCase());
  }
}
export class ScalarFilterExpressionOperators {
  constructor(params) {
    this.params = params;
    this.initOperators();
  }
  getEntries(activeOperators) {
    return getEntries(this.operators, activeOperators);
  }
  findOperator(displayValue) {
    return findMatch(displayValue, this.operators, ({
      displayValue
    }) => displayValue);
  }
  initOperators() {
    const {
      translate,
      equals
    } = this.params;
    this.operators = {
      equals: {
        displayValue: translate('advancedFilterEquals'),
        evaluator: (value, node, params, operand1) => this.evaluateSingleOperandExpression(value, node, params, operand1, !!params.includeBlanksInEquals, equals),
        numOperands: 1
      },
      notEqual: {
        displayValue: translate('advancedFilterNotEqual'),
        evaluator: (value, node, params, operand1) => this.evaluateSingleOperandExpression(value, node, params, operand1, !!params.includeBlanksInEquals, (v, o) => !equals(v, o)),
        numOperands: 1
      },
      greaterThan: {
        displayValue: translate('advancedFilterGreaterThan'),
        evaluator: (value, node, params, operand1) => this.evaluateSingleOperandExpression(value, node, params, operand1, !!params.includeBlanksInGreaterThan, (v, o) => v > o),
        numOperands: 1
      },
      greaterThanOrEqual: {
        displayValue: translate('advancedFilterGreaterThanOrEqual'),
        evaluator: (value, node, params, operand1) => this.evaluateSingleOperandExpression(value, node, params, operand1, !!params.includeBlanksInGreaterThan, (v, o) => v >= o),
        numOperands: 1
      },
      lessThan: {
        displayValue: translate('advancedFilterLessThan'),
        evaluator: (value, node, params, operand1) => this.evaluateSingleOperandExpression(value, node, params, operand1, !!params.includeBlanksInLessThan, (v, o) => v < o),
        numOperands: 1
      },
      lessThanOrEqual: {
        displayValue: translate('advancedFilterLessThanOrEqual'),
        evaluator: (value, node, params, operand1) => this.evaluateSingleOperandExpression(value, node, params, operand1, !!params.includeBlanksInLessThan, (v, o) => v <= o),
        numOperands: 1
      },
      blank: {
        displayValue: translate('advancedFilterBlank'),
        evaluator: value => value == null,
        numOperands: 0
      },
      notBlank: {
        displayValue: translate('advancedFilterNotBlank'),
        evaluator: value => value != null,
        numOperands: 0
      }
    };
  }
  evaluateSingleOperandExpression(value, node, params, operand, nullsMatch, expression) {
    if (value == null) {
      return nullsMatch;
    }
    return expression(params.valueConverter(value, node), operand);
  }
}
export class BooleanFilterExpressionOperators {
  constructor(params) {
    this.params = params;
    this.initOperators();
  }
  getEntries(activeOperators) {
    return getEntries(this.operators, activeOperators);
  }
  findOperator(displayValue) {
    return findMatch(displayValue, this.operators, ({
      displayValue
    }) => displayValue);
  }
  initOperators() {
    const {
      translate
    } = this.params;
    this.operators = {
      true: {
        displayValue: translate('advancedFilterTrue'),
        evaluator: value => !!value,
        numOperands: 0
      },
      false: {
        displayValue: translate('advancedFilterFalse'),
        evaluator: value => value === false,
        numOperands: 0
      },
      blank: {
        displayValue: translate('advancedFilterBlank'),
        evaluator: value => value == null,
        numOperands: 0
      },
      notBlank: {
        displayValue: translate('advancedFilterNotBlank'),
        evaluator: value => value != null,
        numOperands: 0
      }
    };
  }
}