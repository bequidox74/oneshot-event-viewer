export function textNode(text: string): Node {
    return document.createTextNode(text);
}

export function spanNode(text: any, ...cls: string[]): HTMLSpanElement {
    const span = document.createElement("span");
    if (cls) {
        span.classList.add(...cls);
    }
    span.textContent = text.toString();
    return span;
}

export function elemNode(elem: string, ...children: (string | Node)[]): HTMLElement {
    const result = document.createElement(elem);
    result.append(...children);
    return result;
}

export function wrapWithLi(elem: Node | Node[]): HTMLElement {
    if (elem instanceof HTMLLIElement) return elem;
    const li = document.createElement("li");
    if (Array.isArray(elem)) li.append(...elem);
    else li.append(elem);
    return li;
}
