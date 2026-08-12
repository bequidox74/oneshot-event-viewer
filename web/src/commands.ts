import type { EventCommand } from "./types";

function peek<T>(stack: T[]): T | null {
    return stack.length > 0 ? stack[stack.length - 1] : null;
}

function getPlayerName(): string {
    return "Player";
}

function getFacePath(face: string): string {
    return "/faces/" + face + ".png";
}

function makeElementText(tag: string, text: string): HTMLElement {
    const result = document.createElement(tag);
    result.textContent = text;
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

export function emitCommands(commands: [EventCommand]): HTMLElement {
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
        default:
            child = document.createElement("div");
            child.textContent = "Command " + command.code;
            break;
    }
    
    li.appendChild(child);
    return li;
}

function emitShowText(command: EventCommand): HTMLElement {
    let text: string = command.params[0];
    const result = document.createElement("div");
    result.classList.add("dialogue-box");

    if (text.startsWith("@")) {
        const speakerEnd = text.indexOf(" ");
        const speaker = text.substring(1, speakerEnd);
        const portrait = makePortrait(speaker);
        text = text.substring(speakerEnd);
        result.appendChild(portrait);
    }
    
    const content = document.createElement("span");
    const parts = text.split("\\");
    const elements: HTMLElement[] = [];
    elements.push(makeElementText("span", parts[0]));
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
        if (restString) elements.push(makeElementText("span", restString));
    }
    
    for (const element of elements) {
        content.appendChild(element);
    }
    result.appendChild(content);

    return result;
}

function emitCondition(_command: EventCommand): HTMLElement {
    const result = document.createElement("div");
    result.textContent = "Condition";
    return result;
}

function emitWait(command: EventCommand): HTMLElement {
    const result = document.createElement("div");
    result.textContent = `Wait ${command.params[0]} frames`;
    return result;
}
