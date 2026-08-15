import type { EventCommand } from "./types";

const CODE_TO_COMPARISON: { [key: number]: string } = {
    0: "==",
    1: ">=",
    2: "<=",
    3: ">",
    4: "<=",
    5: "!=",
}

const CODE_TO_VARIABLE_OP: { [key: number]: string } = {
    0: "=",
    1: "+=",
    2: "-=",
    3: "*=",
    4: "/=",
    5: "%=",
}

function makeSpan(text: string): HTMLSpanElement {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
}

export function makeCommand(command: EventCommand): Node | Node[] {
    switch (command.code) {
        case 101:
            return makeDialogueBox(command);
        case 106: {
            const result: Node[] = [];
            result.push(document.createTextNode("Wait "));

            const span = document.createElement("span");
            span.classList.add("value");
            span.textContent = command.params[0];
            result.push(span);

            result.push(document.createTextNode(" frames"));
            return result;
        }
        case 111:
            return makeCondition(command);
        case 411:
            return document.createTextNode("Else:");
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
    let text: string = rawText;

    let face: string = "";
    if (rawText.startsWith("@")) {
        let space = rawText.indexOf(" ");
        if (space < 0) space = rawText.length;
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

function makeCondition(command: EventCommand): Node[] {
    // see https://github.com/elizagamedev/mkxp-oneshot/blob/87819a0f6613befaf295eb0d6a09c19e29931e47/scripts/Interpreter_3.rb#L228
    const result: Node[] = [];
    result.push(document.createTextNode("If "));
    const type: number = command.params[0];
    switch (type) {
        case 0: { // switch
            const switchSpan = document.createElement("span");
            switchSpan.classList.add("switch");
            switchSpan.textContent = `Switch ${command.params[1]}`
            result.push(switchSpan);
            
            result.push(document.createTextNode(" is "));

            const onSpan = document.createElement("span");
            const on = command.params[2] == 0 ? "on" : "off";
            onSpan.classList.add(on);
            onSpan.textContent = on.toUpperCase();
            result.push(onSpan);
            break;
        }
        case 1: { // variable
            const varSpan = document.createElement("span");
            varSpan.classList.add("variable");
            varSpan.textContent = `Variable ${command.params[1]}`;
            result.push(varSpan);

            result.push(document.createTextNode(` ${CODE_TO_COMPARISON[command.params[4]]} `))
            
            const valueSpan = document.createElement("span");
            const isInvariable = command.params[3] == 0;
            valueSpan.classList.add(isInvariable ? "value" : "variable");
            const text = (isInvariable ? "" : "Variable ") + command.params[2];
            valueSpan.textContent = text;
            result.push(valueSpan);
            break;
        }
        case 2: { // self switch
            const switchSpan = document.createElement("span");
            switchSpan.classList.add("selfswitch");
            switchSpan.textContent = `Self Switch ${command.params[1]}`;
            result.push(switchSpan);

            result.push(document.createTextNode(" is "));

            const onSpan = document.createElement("span");
            const on = command.params[2] == 0 ? "on" : "off";
            onSpan.classList.add(on);
            onSpan.textContent = on.toUpperCase();
            result.push(onSpan);
            break;
        }
        case 4: { // actor
            const actor = command.params[1] as number;
            const type = command.params[2] as number;
            if (type == 0) { // in party
                const span = document.createElement("span");
                span.classList.add("actor");
                span.textContent = "Actor " + command.params[1];
                result.push(span);
                result.push(document.createTextNode(" is in party"));
            } else {
                console.log("Unknown actor check type: " + type);
                result.push(document.createTextNode(`actor check type ${type} on actor ${actor}`));
            }
            break;
        }
        case 6: {
            const charSpan = document.createElement("span");
            charSpan.classList.add("character");
            charSpan.textContent = "Character " + command.params[1];
            result.push(charSpan);

            result.push(document.createTextNode("'s direction is "));

            const valueSpan = document.createElement("span");
            valueSpan.classList.add("value");
            valueSpan.textContent = command.params[2];
            result.push(valueSpan);
            break;
        }
        case 8: { // item
            result.push(document.createTextNode("player has "));
            const span = document.createElement("span");
            span.classList.add("item");
            span.textContent = "Item " + command.params[1];
            result.push(span);
            break;
        }
        case 11: { // button
            const span = document.createElement("span");
            span.classList.add("button");
            span.textContent = "Button " + command.params[1];
            result.push(span);
            result.push(document.createTextNode(" is pressed"));
            break;
        }
        case 12: { // script
            const span = document.createElement("span");
            span.classList.add("code");
            span.textContent = command.params[1];
            result.push(span);
            break;
        }
        default: {
            console.log(`Unknown condition type ${type}`);
            result.push(document.createTextNode(JSON.stringify(command.params)));
            break;
        }
    }
    result.push(document.createTextNode(":"));
    return result;
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
