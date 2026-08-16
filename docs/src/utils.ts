type CollapsibleHeading = {
  level: number;
  name: string | undefined;
  open?: boolean;
  id?: number;
  linkId?: string;
};

export function makeCollapsibleHeading(
  data: CollapsibleHeading,
): HTMLDetailsElement {
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  details.appendChild(summary);
  details.open = data.open ?? true;

  const heading = document.createElement("h" + data.level);

  const nameSpan = document.createElement("span");
  nameSpan.textContent = data.name ? data.name : "(unnamed)";
  if (!data.name) nameSpan.classList.add("subtle");
  heading.appendChild(nameSpan);

  if (data.id) {
    const idSpan = document.createElement("span");
    idSpan.textContent = ` [${data.id}]`;
    heading.appendChild(idSpan);
  }

  if (data.linkId) {
    const a = document.createElement("a");
    a.classList.add("parent-link");
    a.textContent = "↑";
    a.title = "Go to parent";
    a.href = "#" + data.linkId;
    heading.appendChild(a);
  }

  summary.appendChild(heading);
  return details;
}

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

export function elemNode(
  elem: string,
  ...children: (string | Node)[]
): HTMLElement {
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
