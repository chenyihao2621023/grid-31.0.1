let element = null;
export function sanitizeHtml(text) {
    if (text == null) {
        return undefined;
    }
    else if (text === '') {
        return '';
    }
    element !== null && element !== void 0 ? element : (element = document.createElement('div'));
    element.textContent = String(text);
    return element.innerHTML;
}
