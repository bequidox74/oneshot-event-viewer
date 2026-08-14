import type { EventCommand } from "./types";

function makeSpan(text: string): HTMLSpanElement {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
}

export function makeCommand(command: EventCommand): HTMLElement {
    switch (command.code) {
        case 101:
            return makeDialogueBox(command);
        // case 106:
        //     return makeWait(command);
        // case 111:
        //     return makeCondition(command);
        // case 411:
        //     return makeElse();
        default:
            return makeUnknown(command);
    }
}

function makePortrait(face: string): HTMLElement {
    const root = document.createElement("div");
    root.classList.add("portrait-container");

    const image = new Image();
    const file = face.substring(1).toLowerCase();
    image.classList.add("portrait");
    image.src = `faces/${file}.png`;
    image.title = face;
    root.appendChild(image);

    const label = document.createElement("span");
    label.classList.add("portrait-label");
    label.textContent = face;
    root.appendChild(label);

    return root;
}

function makeDialogueBox(command: EventCommand): HTMLElement {
    const root = document.createElement("div");

    const rawText: string = command.params[0];
    if (!rawText.trim()) return root;
    let text: string = rawText;

    let face: string = "";
    if (rawText.startsWith("@")) {
        const space = rawText.indexOf(" ");
        face = rawText.substring(0, space);
        text = rawText.substring(space + 1);
    }

    if (face === "@ed") {
        root.classList.add("ed-speak");
    } else {
        const portrait = makePortrait(face);
        root.classList.add("dialogue-box");
        root.appendChild(portrait);
    }

    const content = document.createElement("span");
    content.append(...parseEscapes(text));
    root.appendChild(content);

    return root;
}

function parseEscapes(raw: string): Node[] {
    const result: Node[] = [];
    let color = 0;
    let start = 0;
    let end = 0;

    function flush() {
        const text = raw.substring(start, end);
        const node = color != 0 ? document.createElement("span") : document.createTextNode(text);
        if (color != 0) {
            (node as HTMLElement).classList.add(`color${color}`);
        }
        start = end;
        result.push(node);
    }

    while (end < raw.length) {
        let c = raw[end];
        if (c === "\\") {
            flush();
            c = raw[end + 1];
            end += 2;
            start = end;
            switch (c) {
                case ".": {
                    result.push(makeInlinePause());
                    break;
                }
                case "|": {
                    result.push(makeInlineLongPause());
                    break;
                }
                case "n": {
                    result.push(document.createElement("br"));
                    break;
                }
                case "\\": {
                    result.push(document.createTextNode("\\"));
                    break;
                }
                case ">": {
                    result.push(makeInlineWait());
                    break;
                }
                case "@": {
                    const space = raw.indexOf(" ", start + 1);
                    const face = raw.substring(start - 1, space);
                    start = space;
                    result.push(makeInlinePortraitChange(face));
                    break;
                }
                case "p": {
                    const name = "Player";
                    const span = document.createElement("span");
                    span.textContent = name;
                    span.classList.add("player");
                    result.push(span);
                    break;
                }
            }
        } else end++;
    }
    if (end - start > 0) flush();

    return result;
}

function makeInlinePause(): HTMLElement {
    const root = document.createElement("span");
    root.classList.add("inline", "inline-pause");
    root.textContent = ".";
    return root;
}

function makeInlineLongPause(): HTMLElement {
    const root = document.createElement("span");
    root.classList.add("inline", "inline-longpause");
    root.textContent = "|";
    return root;
}

function makeInlineWait(): HTMLElement {
    const root = document.createElement("span");
    root.classList.add("inline", "inline-wait");
    root.textContent = ">";
    return root;
}

function makeInlinePortraitChange(face: string): HTMLElement {
    const root = document.createElement("span");
    root.classList.add("inline", "inline-change");
    root.textContent = "@";
    root.title = face;
    return root;
}

function makeUnknown(command: EventCommand): HTMLElement {
    const root = document.createElement("span");
    let content = `Command ${command.code}`;
    if (command.params) {
        content += ` ${JSON.stringify(command.params)}`;
    }
    root.textContent = content;
    return root;
}
