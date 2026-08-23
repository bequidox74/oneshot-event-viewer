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

export function createValueNode(text: string): HTMLSpanElement {
  return createSpanNode(text, "value");
}

export function createVariableNode(text: string): HTMLSpanElement {
  return createSpanNode(text, "variable");
}

export function createOnOff(value: boolean): HTMLSpanElement {
  const on = value ? "on" : "off";
  return createSpanNode(on.toUpperCase(), on);
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
  type: "items" | "vars" | "switches" | "actors" | "dir" | "map" | "skills",
  context: Context,
  tooltip: boolean = true,
): Node {
  let cls;
  let label;
  switch (type) {
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
    case "dir":
      cls = "value";
      label = "Direction";
      break;
    case "map":
      cls = "value";
      label = "Map";
      break;
    case "skills":
      cls = "item";
      label = "Skill";
      break;
  }

  let text: string = "";
  if (type == "actors" && id <= 0) {
    text = id == 0 ? "This Event" : "Player";
  } else if (type == "dir") {
    if (context.is2k3) {
      switch (id) {
        case -1:
          text = "retain";
          break;
        case 0:
          text = "up";
          break;
        case 1:
          text = "right";
          break;
        case 2:
          text = "down";
          break;
        case 3:
          text = "left";
          break;
      }
    } else {
      switch (id) {
        case 2:
          text = "down";
          break;
        case 4:
          text = "left";
          break;
        case 6:
          text = "right";
          break;
        case 8:
          text = "up";
          break;
      }
    }
  } else if (type == "map") {
    text = context.maps[id];
    if (!text) {
      text = "(unnamed)";
      cls = "subtle";
    }
  } else {
    text = context.misc[type]![id - 1];
    if (!text) text = `${label} ${id}`;
  }

  const out = createSpanNode(text, cls);
  if (tooltip) addTooltip(out, `${label} ${id}`);
  return out;
}

export function addTooltip(
  element: HTMLElement,
  content: string | HTMLElement,
): Node {
  element.classList.add("tooltip-base");
  const contentElem =
    content instanceof Node ? content : createSpanNode(content, "tooltip-text");
  contentElem.classList.add("tooltip");
  element.appendChild(contentElem);
  return contentElem;
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
