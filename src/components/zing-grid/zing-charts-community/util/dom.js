export function injectStyle(document, cssStyle) {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = cssStyle;
  document.head.insertBefore(styleElement, document.head.querySelector('style'));
}