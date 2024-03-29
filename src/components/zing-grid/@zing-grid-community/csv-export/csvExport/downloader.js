export class Downloader {
  static download(fileName, content) {
    const win = document.defaultView || window;
    if (!win) {
      console.warn('ZING Grid: There is no `window` associated with the current `document`');
      return;
    }
    const element = document.createElement('a');
    const url = win.URL.createObjectURL(content);
    element.setAttribute('href', url);
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: false,
      cancelable: true,
      view: win
    }));
    document.body.removeChild(element);
    win.setTimeout(() => {
      win.URL.revokeObjectURL(url);
    }, 0);
  }
}