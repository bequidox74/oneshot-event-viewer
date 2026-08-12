import type { EventCommand } from "./types";

const CODE_TO_COMPARISON: { [key: number]: string } = {
    0: "==",
    1: ">=",
    2: "<=",
    3: ">",
    4: "<=",
    5: "!=",
}

function peek<T>(stack: T[]): T | null {
    return stack.length > 0 ? stack[stack.length - 1] : null;
}

function getPlayerName(): string {
    return "Player";
}

function getFacePath(face: string): string {
    return "/faces/" + face + ".png";
}

function makeElementFromText(tag: string, text: string): HTMLElement {
    const result = document.createElement(tag);
    result.textContent = text;
    return result;
}

function makeElementFromHtml(tag: string, html: string): HTMLElement {
    const result = document.createElement(tag);
    result.innerHTML = html;
    return result;
}

function makePortrait(face: string): HTMLElement {
    const container = document.createElement("div");
    container.classList.add("portrait-container");

    const name = document.createElement("span");
    container.classList.add("portrait-text");
    name.textContent = "@" + face;

    const portrait = new Image();
    portrait.classList.add("portrait");
    portrait.src = getFacePath(face);

    container.appendChild(portrait);
    container.appendChild(name);
    return container;
}

function makePause(): HTMLElement {
    const image = document.createElement("img");
    image.classList.add("inline-command");
    image.classList.add("pause");
    image.title = "Pause";
    return image;
}

function makeLongPause(): HTMLElement {
    const image = document.createElement("img");
    image.classList.add("inline-command");
    image.classList.add("long-pause");
    image.title = "Long Pause";
    return image;
}

function makeWaitForAction(): HTMLElement {
    const image = document.createElement("img");
    image.classList.add("inline-command");
    image.classList.add("wait-action");
    image.title = "Wait for Action";
    return image;
}

function makeChangePortrait(face: string): HTMLElement {
    const root = document.createElement("span");
    root.classList.add("inline-command");
    root.classList.add("change-portrait");
    root.classList.add("popup");

    const image = document.createElement("img");

    const portrait = makePortrait(face);
    portrait.title = "Change Portrait";

    root.appendChild(image);
    root.appendChild(portrait);
    return root;
}

function makeEdMessageBox(code: string): HTMLElement {
    const root = document.createElement("div");
    root.classList.add("dialogue-box");
    root.style = "display: block";

    const box = document.createElement("div");
    box.classList.add("ed-box");
    
    const title = document.createElement("div");
    title.classList.add("ed-title");

    const boxInner = document.createElement("div");
    boxInner.classList.add("ed-inner");
    
    const condition = makeElementFromHtml("span", `If <span class="variable">${code}</span>:`);
    condition.style = "text-align: left";

    const paren = code.indexOf("(");
    const type = code.substring(7, paren);
    let buttonLabels: string[] = [];
    switch (type) {
        case "info":
        case "err":
            buttonLabels = ["Ok"];
            break;
        case "yesno":
            root.title = "If Yes";
            buttonLabels = ["Yes", "No"]
            break;
    }
    
    let text = code.substring(paren + 2, code.length - 2);
    let span = document.createElement("span");
    text = text.replaceAll("\\\\p", getPlayerName());
    if (text.startsWith(" ")) {
        span.classList.add("center-text");
    }
    span.textContent = text;
    
    const buttons = document.createElement("div");
    buttons.classList.add("ed-buttons");
    for (const label of buttonLabels) {
        const button = document.createElement("div");
        button.classList.add("ed-button");
        button.textContent = label;
        buttons.appendChild(button);
    }

    box.appendChild(title);
    box.append(boxInner);

    boxInner.appendChild(span);
    boxInner.appendChild(buttons);
    
    root.appendChild(condition);
    root.appendChild(box);
    return root;
}

export function emitCommands(commands: EventCommand[]): HTMLElement {
    const root = document.createElement("ul");

    const stack: HTMLElement[] = [];

    for (const command of commands) {
        let level = command.indent ? command.indent : 0;
        const currentLevel = stack.length;

        if (level < currentLevel) stack.pop();
        else if (level > currentLevel) {
            const newRoot = document.createElement("ul");
            const parent = peek(stack) ?? root;
            parent.appendChild(newRoot);
            stack.push(newRoot);
        }

        const parent = peek(stack) ?? root;
        const result = emitCommand(command);
        if (result) {
            parent.appendChild(result);
        }
    }

    return root;
}

function emitCommand(command: EventCommand): HTMLElement {
    const li = document.createElement("li");
    li.classList.add("command");
    let child: HTMLElement;

    // see https://github.com/elizagamedev/mkxp-oneshot/blob/87819a0f6613befaf295eb0d6a09c19e29931e47/scripts/Interpreter_2.rb#L12
    switch (command.code) {
        case 101:
            child = emitShowText(command);
            break;
        case 106:
            child = emitWait(command);
            break;
        case 111:
            child = emitCondition(command);
            break;
        case 411:
            child = makeElementFromText("span", "Else:");
            break;
        default:
            child = document.createElement("div");
            child.textContent = "Command " + command.code;
            break;
    }

    li.appendChild(child);
    return li;
}

function handleEscapes(text: string): HTMLElement[] {
    const parts = text.split("\\");
    const elements: HTMLElement[] = [];
    elements.push(makeElementFromText("span", parts[0]));
    for (let i = 1; i < parts.length; i++) {
        let part: string = parts[i];
        let rest: number = 1;
        switch (part[0]) {
            case ".":
                elements.push(makePause());
                break;
            case "|":
                elements.push(makeLongPause());
                break;
            case ">":
                elements.push(makeWaitForAction());
                break;
            case "n":
                elements.push(document.createElement("br"));
                break;
            case "@":
                const space = part.indexOf(" ");
                elements.push(makeChangePortrait(part.substring(1, space)));
                rest = space;
                break;
            case "p": {
                const span = document.createElement("span");
                span.classList.add("player");
                span.textContent = getPlayerName();
                elements.push(span);
                break;
            }
            case "\\":
                part = "\\" + part;
                break;
            case "c": {
                const re = /c\[(\d)](.+?)$/;
                const match = part.match(re)!;
                const color = match[1];
                const text = match[2];

                const span = document.createElement("span");
                span.classList.add("color" + color);
                span.textContent = text;
                elements.push(span);
                rest = part.length;
                break;
            }
            default:
                console.log("unknown escape: " + part[0]);
                rest = 0;
                break;
        }
        const restString = part.substring(rest);
        if (restString) elements.push(makeElementFromText("span", restString));
    }
    return elements;
}

function emitShowText(command: EventCommand): HTMLElement {
    let text: string = command.params[0];
    const result = document.createElement("div");
    result.classList.add("dialogue-box");

    if (text.startsWith("@")) {
        const speakerEnd = text.indexOf(" ");
        const speaker = text.substring(1, speakerEnd);
        text = text.substring(speakerEnd);
        
        if (speaker !== "ed") {
            const portrait = makePortrait(speaker);
            result.appendChild(portrait);
        } else {
            result.title = "@ed";
            result.classList.add("center-text");
        }
    } else if (text.startsWith("$")) {
        result.classList.add("note");
        text = text.substring(1);
    }

    const content = document.createElement("span");
    const elements = handleEscapes(text);
    for (const element of elements) {
        content.appendChild(element);
    }
    result.appendChild(content);

    return result;
}

function emitCondition(command: EventCommand): HTMLElement {
    // see https://github.com/elizagamedev/mkxp-oneshot/blob/87819a0f6613befaf295eb0d6a09c19e29931e47/scripts/Interpreter_3.rb#L228
    const type = command.params[0] as number;
    switch (type) {
        case 0: { // switch
            const sw = command.params[1] as number;
            const cls = command.params[2] as number == 0 ? "on" : "off";
            const text = cls.toUpperCase();
            const html = `If <span class="variable">Switch ${sw}</span> is <span class=${cls}>${text}</span>:`;
            return makeElementFromHtml("span", html);
        }
        case 1: { // variable
            const vr = command.params[1] as number; // variable
            const vl = command.params[2] as number; // value
            const vt = command.params[3] as number; // value type (0=inline, 1=gamevar)
            const cmp = command.params[4] as number; // comparison

            const parts: string[] = [];
            parts.push('If');
            parts.push(`<span class="variable">Variable ${vr}</span>`);
            parts.push(CODE_TO_COMPARISON[cmp]);
            parts.push(vt == 0 ? vt.toString() : `<span class="variable">Variable ${vl}</span>`);
            return makeElementFromHtml("span", parts.join(" ") + ":");
        }
        case 2: { // self switch
            const ss = command.params[1] as string;
            const on = command.params[2] as number == 0 ? "on" : "off";
            const html = `<span class="variable">Self Switch <b>${ss}</b></span> is <span class="${on}">${on.toUpperCase()}</span>:`;
            return makeElementFromHtml("span", html);
        }
        case 3: { // timer
            const val = command.params[1] as number;
            const type = command.params[2] as number == 0 ? ">=" : "<=";
            const html = `If <span class="variable">play time</span> is ${type} ${val} seconds:`
            return makeElementFromHtml("span", html);
        }
        case 4: { // actor
            const actor = command.params[1] as number;
            const type = command.params[2] as number;
            if (type == 0) { // in party
                return makeElementFromHtml("span", `If <span>Actor ${actor}</span> is in party:`);
            } else {
                console.log("Unknown actor check type: " + type);
                return makeElementFromText("span", `Condition: ${command.params}`);
            }
        }
        case 8: { // item
            const id = command.params[1] as number;
            return makeElementFromHtml("span", `If player has <span class="variable">Item ${id}</span>:`);
        }
        case 11: { // button
            const button = command.params[1];
            return makeElementFromHtml("span", `If <span class="variable">Button ${button}</span> is pressed:`);
        }
        case 12: { // script
            const code = command.params[1] as string;
            if (code.startsWith("EdText")) {
                return makeEdMessageBox(code);
            } else {
                return makeElementFromHtml("span", `If <span class="variable">${code}</span>:`)
            }
        }
        default: {
            console.log("Unknown condition type: " + type);
            return makeElementFromHtml("span", `Condition: ${command.params}`);
        }
    }
}

function emitWait(command: EventCommand): HTMLElement {
    const result = document.createElement("div");
    result.textContent = `Wait ${command.params[0]} frames`;
    return result;
}
