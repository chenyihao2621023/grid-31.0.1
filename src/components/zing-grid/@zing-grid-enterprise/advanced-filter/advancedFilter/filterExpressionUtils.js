export function getSearchString(value, position, endPosition) {
  if (!value) {
    return '';
  }
  const numChars = endPosition - position;
  return numChars ? value.slice(0, value.length - numChars) : value;
}
export function updateExpression(expression, startPosition, endPosition, updatedValuePart, appendSpace, appendQuote, empty) {
  const secondPartStartPosition = endPosition + (!expression.length || empty ? 0 : 1);
  let positionOffset = 0;
  if (appendSpace) {
    if (expression[secondPartStartPosition] === ' ') {
      positionOffset = 1;
    } else {
      updatedValuePart += ' ';
      if (appendQuote) {
        updatedValuePart += `"`;
      }
    }
  }
  const updatedValue = expression.slice(0, startPosition) + updatedValuePart + expression.slice(secondPartStartPosition);
  return {
    updatedValue,
    updatedPosition: startPosition + updatedValuePart.length + positionOffset
  };
}
export function findStartPosition(expression, position, endPosition) {
  let startPosition = position;
  while (startPosition < endPosition) {
    const char = expression[startPosition];
    if (char !== ' ') {
      break;
    }
    startPosition++;
  }
  return startPosition;
}
export function findEndPosition(expression, position, includeCloseBracket, isStartPositionUnknown) {
  let endPosition = position;
  let isEmpty = false;
  while (endPosition < expression.length) {
    const char = expression[endPosition];
    if (char === '(') {
      if (isStartPositionUnknown && expression[endPosition - 1] === ' ') {
        isEmpty = true;
      } else {
        endPosition = endPosition - 1;
      }
      break;
    } else if (char === ' ' || includeCloseBracket && char === ')') {
      endPosition = endPosition - 1;
      break;
    }
    endPosition++;
  }
  return {
    endPosition,
    isEmpty
  };
}
export function checkAndUpdateExpression(params, userValue, displayValue, endPosition) {
  if (displayValue !== userValue) {
    params.expression = updateExpression(params.expression, endPosition - userValue.length + 1, endPosition, displayValue).updatedValue;
  }
}
export function escapeQuotes(value) {
  return value.replace(/(['"])/, '\\$1');
}