import type { Context } from "./tree";

type CollapsibleHeading = {
  level: number;
  name: string | undefined;
  open?: boolean;
  id?: number;
  linkId?: string;
};

export function createCollapsibleHeading(
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

export function createSpanNode(
  text: string,
  ...cls: string[]
): HTMLSpanElement {
  const span = document.createElement("span");
  if (cls && cls.length > 0) {
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

export function lookupNode(
  id: number,
  property: "items" | "vars" | "switches" | "actors",
  context: Context,
): Node {
  let cls;
  let label;
  switch (property) {
    case "items":
      cls = "item";
      label = "Item";
      break;
    case "vars":
      cls = "variable";
      label = "Variable";
      break;
    case "switches":
      cls = "switch";
      label = "Switch";
      break;
    case "actors":
      cls = "character";
      label = "Character";
      break;
  }

  let text: string;
  if (property == "actors" && id <= 0) {
    text = id == 0 ? "This Event" : "Player";
  } else {
    text = context.misc[property][id - 1];
    if (!text) text = `${label} ${id}`;
  }

  const out = createSpanNode(text, cls);
  addTooltip(out, `${label} ${id}`);
  return out;
}

export function addTooltip(
  element: HTMLElement,
  content: string | HTMLElement,
): void {
  element.classList.add("tooltip-base");
  const contentElem =
    content instanceof Node ? content : createSpanNode(content, "tooltip-text");
  contentElem.classList.add("tooltip");
  element.appendChild(contentElem);
}

export function getBoolOption(key: string, def: boolean = false): boolean {
  const value = sessionStorage.getItem(key);
  return value == null ? def : value === "true";
}

export function setBoolOption(key: string, value: boolean): void {
  sessionStorage.setItem(key, value.toString());
}

export function setCheckboxOn(checkbox: HTMLElement, on: boolean): void {
  if (on) checkbox.classList.add("on");
  else checkbox.classList.remove("on");
}
