import type { AudioFile, EventCommand } from "./types";
import { createSpanNode, createTextNode } from "./utils";

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

function getVariable(id: number): string {
    return `Variable ${id}`;
}

function getItem(id: number): string {
    return `Item ${id}`;
}


function characterNode(char: number): Node {
    return createSpanNode(`Character ${char}`, "character");
}

function itemNode(id: number): Node {
    return createSpanNode(getItem(id), "item");
}

function varValueNode(type: number, operand: number): Node {
    const inv = type == 0;
    return createSpanNode(inv ? operand.toString() : getVariable(operand), inv ? "value" : "variable");
}

function actorNode(id: number): Node {
    return createSpanNode(`Actor ${id}`, "actor");
}

export function makeCommand(command: EventCommand): Node | Node[] {
    // see https://github.com/elizagamedev/mkxp-oneshot/blob/master/scripts/Interpreter_2.rb
    const params = command.params;
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
        case 102:
            return makeShowChoices(command);
        case 103: // Input Number
            return [
                createTextNode("Input Number into "),
                createSpanNode(getVariable(params[0])),
                createTextNode(" with max digits "),
                createSpanNode(getVariable(params[1])),
            ];
        case 104:
            return makeChangeTextOptions(command);
        case 105: // Button Input Processing
            return [
                createTextNode("Button Input Processing for button "),
                createSpanNode(params[0], "value"),
            ];
        case 111:
            return makeCondition(command);
        case 112:
            return document.createTextNode("Loop");
        case 113:
            return document.createTextNode("Break Loop");
        case 115:
            return createTextNode("Exit Event Processing");
        case 116:
            return document.createTextNode("Erase Event");
        case 117:
            return makeCallCommonEvent(command);
        case 118: // Label
            return [
                createTextNode('Label "'),
                createSpanNode(params[0], "value"),
                createTextNode('"'),
            ];
        case 119: // Jump to Label
            return [
                createTextNode('Jump to Label "'),
                createSpanNode(params[0], "value"),
                createTextNode('"'),
            ];
        case 121:
            return makeControlSwitches(command);
        case 122:
            return makeControlVariables(command);
        case 123:
            return makeControlSelfSwitch(command);
        case 126: // Change Items
            return makeChangeItems(command);
        case 129: { // Change Party Member
            const add = params[1] == 0;
            const result = [
                createTextNode(add ? "Add " : "Remove "),
                actorNode(params[0]),
                createTextNode(add ? " to party" : " from party"),
            ];
            if (add) {
                result.push(
                    createTextNode(params[2] == 1 ? " with" : " without"),
                    createTextNode(" setup"),
                );
            }
            return result;
        }
        case 131: // Change Windowskin
            return [
                createTextNode('Change Windowskin to "'),
                createSpanNode(params[0], "value"),
                createTextNode('"'),
            ];
        case 201:
            return makeTransferPlayer(command);
        case 202:
            return makeSetEventLocation(command);
        case 203:
            return makeScrollMap(command);
        case 207:
            return makeShowAnimation(command);
        case 209:
            return makeSetMoveRoute(command);
        case 210:
            return document.createTextNode("Wait for Move's Completion");
        case 221:
            return createTextNode("Prepare for Transition");
        case 222: // Execute Transition
            return [
                createTextNode('Execute Transition "'),
                createSpanNode(params[0], "value"),
                createTextNode('"'),
            ];
        case 223: // Change Screen Color Tone
            return [
                createTextNode("Change Screen Color Tone to "),
                createSpanNode(params[0], "value"),
                createTextNode(" over "),
                createSpanNode(params[1], "value"),
                createTextNode(" frames"),
            ];
        case 224: // Screen Flash
            return [
                createTextNode("Start Screen Flash to color "),
                createSpanNode(params[0], "value"),
                createTextNode(" over "),
                createSpanNode(params[1], "value"),
                createTextNode(" frames"),
            ];
        case 225: // Screen Shake
            return [
                createTextNode("Start Screen Shake, power "),
                createSpanNode(params[0], "value"),
                createTextNode(", speed "),
                createSpanNode(params[1], "value"),
                createTextNode(", duration "),
                createSpanNode(params[2], "value"),
                createTextNode(" frames"),
            ];
        case 231:
            return makeShowPicture(command);
        case 232:
            return makeMovePicture(command);
        case 234: // Change Picture Color Tone
            return [
                createTextNode("Change Picture "),
                createSpanNode(params[0], "value"),
                createTextNode("'s tone to "),
                createSpanNode(params[1], "value"),
                createTextNode(" over "),
                createSpanNode(params[2], "value"),
                createTextNode(" frames"),
            ];
        case 235:
            return makeErasePicture(command);
        case 241:
            return makePlayBgm(command);
        case 242:
            return makeFadeOutBgm(command);
        case 245:
            return makePlayBgs(command);
        case 246:
            return makeFadeOutBgs(command);
        case 247:
            return createTextNode("Memorize BG Music/Sound");
        case 248:
            return createTextNode("Restore BG Music/Sound");
        case 249:
            return makePlayMe(command);
        case 250:
            return makePlaySe(command);
        case 322:
            return [
                createTextNode("Change Actor Graphic of "),
                actorNode(params[0]),
                createTextNode(' to "'),
                createSpanNode(params[1], "value"),
                createTextNode('", hue '),
                createSpanNode(params[2], "value"),
            ];
        case 355:
            return makeScript(command);
        case 402:
            return makeWhenChoice(command);
        case 403:
            return createTextNode("Cancel Choice");
        case 411:
            return document.createTextNode("Else:");
        case 413:
            return document.createTextNode("Repeat Above");
        default:
            console.log(`Unknown command code ${command.code}`);
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
    const color = 0;
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

function makeShowChoices(command: EventCommand): HTMLElement {
    const root = document.createElement("div");

    const title = document.createTextNode("Show Choices:");
    root.appendChild(title);

    const options = command.params[0] as string[];
    const choices = document.createElement("ul");
    choices.classList.add("choices");
    for (const option of options) {
        const li = document.createElement("li");
        li.textContent = option;
        li.innerHTML = li.innerHTML.replaceAll("\\p", `<span class="player">Player</span>`);
        choices.appendChild(li);
    }
    root.appendChild(choices);

    return root;
}

function makeWhenChoice(command: EventCommand): Node[] {
    const result: Node[] = [];
    const choice = command.params[1];
    result.push(document.createTextNode('When choice is "'));

    const span = createSpanNode(choice, "choice");
    span.innerHTML = span.innerHTML.replaceAll("\\p", `<span class="player">Player</span>`);
    result.push(span);

    result.push(document.createTextNode('":'));
    return result;
}

function makeScript(command: EventCommand): Node[] {
    const result: Node[] = [];
    result.push(document.createTextNode("Script: "));

    const script = document.createElement("div");
    script.classList.add("code");
    script.textContent = command.params[0];
    result.push(script);

    return result;
}

function makePlayBgm(command: EventCommand): Node[] {
    const audioFile = command.params[0].AudioFile as AudioFile;
    return [
        createTextNode('Play BG music "'),
        createSpanNode(audioFile.name, "value"),
        createTextNode('", volume '),
        createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
        createTextNode(", pitch "),
        createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
    ];
}

function makeFadeOutBgm(command: EventCommand): Node[] {
    return [
        createTextNode("Fade Out Bacgkround Music over "),
        createSpanNode(command.params[0], "value"),
        createTextNode(" seconds"),
    ];
}

function makePlayBgs(command: EventCommand): Node[] {
    const audioFile = command.params[0].AudioFile as AudioFile;
    return [
        createTextNode('Play background sound '),
        createSpanNode(audioFile.name, "value"),
        createTextNode('", volume '),
        createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
        createTextNode(", pitch "),
        createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
    ];
}

function makeFadeOutBgs(command: EventCommand): Node[] {
    return [
        createTextNode("Fade Out Bacgkround Sound over "),
        createSpanNode(command.params[0], "value"),
        createTextNode(" seconds"),
    ];
}

function makePlaySe(command: EventCommand): Node[] {
    const audioFile = command.params[0].AudioFile as AudioFile;
    return [
        createTextNode('Play sound effect "'),
        createSpanNode(audioFile.name, "value"),
        createTextNode('", volume '),
        createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
        createTextNode(", pitch "),
        createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
    ];
}

function makePlayMe(command: EventCommand): Node[] {
    const audioFile = command.params[0].AudioFile as AudioFile;
    return [
        createTextNode('Play music effect "'),
        createSpanNode(audioFile.name, "value"),
        createTextNode('", volume '),
        createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
        createTextNode(", pitch "),
        createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
    ];
}

function makeControlSwitches(command: EventCommand): Node[] {
    const result: Node[] = [];
    const from: number = command.params[0];
    const to: number = command.params[1];

    if (from === to) {
        result.push(document.createTextNode("Turn "));
        result.push(createSpanNode(`Switch ${from}`, "switch"));
    } else {
        result.push(document.createTextNode("Turn Switches "));
        result.push(createSpanNode(command.params[0], "value"));
        result.push(document.createTextNode(".."));
        result.push(createSpanNode(command.params[1], "value"));
    }

    result.push(document.createTextNode(" "));
    const on = command.params[2] == 0 ? "on" : "off";
    result.push(createSpanNode(on.toUpperCase(), on));
    return result;
}

function makeControlVariables(command: EventCommand): Node[] {
    const result: Node[] = [];
    result.push(document.createTextNode("Change "));

    const from = command.params[0] as number;
    const to = command.params[1] as number;
    const type = command.params[2] as number;
    const operandType = command.params[3] as number;
    const operand = command.params[4] as number;
    const extra: number | undefined = command.params[5];

    if (from === to) {
        result.push(createSpanNode(`Variable ${from}`, "variable"));
    } else {
        result.push(document.createTextNode("Variables "))
        result.push(createSpanNode(from.toString(), "value"));
        result.push(document.createTextNode(".."));
        result.push(createSpanNode(to.toString(), "value"));
    }

    result.push(document.createTextNode(" "));
    result.push(document.createTextNode(CODE_TO_VARIABLE_OP[type]));
    result.push(document.createTextNode(" "));

    switch (operandType) {
        case 0: // invariable
            result.push(createSpanNode(operand.toString(), "value"));
            break;
        case 1: // variable
            result.push(createSpanNode(`Variable ${operand}`, "variable"));
            break;
        case 2: // random
            result.push(document.createTextNode("random value from "));
            result.push(createSpanNode(operand.toString(), "value"));
            result.push(document.createTextNode(" to "));
            result.push(createSpanNode(extra!.toString(), "value"));
            break;
        case 3: // item
            result.push(document.createTextNode(`# of `));
            result.push(createSpanNode(`Item ${operand.toString()}`, "item"));
            result.push(document.createTextNode(` carried`));
            break;
        case 6: { // character
            let par = "";
            switch (extra!) {
                case 0:
                    par = "x coordinate";
                    break;
                case 1:
                    par = "y coordinate";
                    break;
                case 2:
                    par = "direction";
                    break;
                case 3:
                    par = "screen x coordinate";
                    break;
                case 4:
                    par = "screen x coordinate";
                    break;
                case 5:
                    par = "terrain tag";
                    break;
            }
            result.push(createSpanNode(`Character ${operand}`, "character"));
            result.push(document.createTextNode(` ${par}`));
            break;
        }
        case 7: { // other
            let text = "";
            switch (extra!) {
                case 0:
                    text = "map id";
                    break;
                case 1:
                    text = "# of party members";
                    break;
                case 3:
                    text = "steps";
                    break;
                case 4:
                    text = "play time";
                    break;
                case 5:
                    text = "timer";
                    break;
                case 6:
                    text = "save count";
                    break;
            }
            result.push(createSpanNode(text, "value"));
            break;
        }
        default:
            break;
    }

    return result;
}

function makeControlSelfSwitch(command: EventCommand): Node[] {
    const on = command.params[1] == 0 ? "on" : "off";
    return [
        document.createTextNode("Set "),
        createSpanNode(`Self Switch ${command.params[0]}`, "selfswitch"),
        document.createTextNode(" "),
        createSpanNode(on.toUpperCase(), on),
    ];
}

function makeScrollMap(command: EventCommand): Node[] {
    return [
        createTextNode("Scroll Map: direction "),
        createSpanNode(command.params[0], "value"),
        createTextNode(", distance "),
        createSpanNode(command.params[1], "value"),
        createTextNode(", speed "),
        createSpanNode(command.params[2], "value"),
    ];
}

function makeShowAnimation(command: EventCommand): Node[] {
    return [
        createTextNode("Set "),
        characterNode(command.params[0]),
        createTextNode("'s animation ID to "),
        createSpanNode(command.params[1], "value"),
    ];
}

function makeSetMoveRoute(command: EventCommand): Node {
    const details = document.createElement("details") as HTMLDetailsElement;
    const summary = document.createElement("summary");
    const content = document.createElement("div");
    content.classList.add("code");
    summary.textContent = "Set Move Route for ";
    summary.append(createSpanNode(`Character ${command.params[0]}`, "character"));
    details.appendChild(summary);
    content.append(JSON.stringify(command.params[1]));
    details.appendChild(content);
    return details;
}

function makeCallCommonEvent(command: EventCommand): Node[] {
    return [
        document.createTextNode("Call Common Event "),
        createSpanNode(command.params[0], "value"),
    ];
}

function makeShowPicture(command: EventCommand): Node[] {
    const id = command.params[0] as number;
    const name = command.params[1] as string;
    const origin = command.params[2] as number;
    const literal = command.params[3] == 0;
    const x = command.params[4] as number;
    const y = command.params[5] as number;
    const zoomX = command.params[6] as number;
    const zoomY = command.params[7] as number;
    const opacity = command.params[8] as number;
    const blendType = command.params[9] as number;

    const xNode = createSpanNode(literal ? x.toString() : `Variable ${x}`, literal ? "value" : "variable");
    const yNode = createSpanNode(literal ? y.toString() : `Variable ${y}`, literal ? "value" : "variable");

    return [
        createTextNode("Show Picture "),
        createSpanNode(id.toString(), "value"),
        createTextNode(' "'),
        createSpanNode(name, "value"),
        createTextNode('" with origin '),
        createSpanNode(origin.toString(), "value"),
        createTextNode(" at ("),
        xNode,
        createTextNode(","),
        yNode,
        createTextNode(") with zoom ("),
        createSpanNode(zoomX.toString(), "value"),
        createTextNode(","),
        createSpanNode(zoomY.toString(), "value"),
        createTextNode("), opacity "),
        createSpanNode(opacity.toString(), "value"),
        createTextNode(", blend type "),
        createSpanNode(blendType.toString(), "value"),
    ];
}

function makeMovePicture(command: EventCommand): Node[] {
    const id = command.params[0] as number;
    const duration = command.params[1] as string;
    const origin = command.params[2] as number;
    const literal = command.params[3] == 0;
    const x = command.params[4] as number;
    const y = command.params[5] as number;
    const zoomX = command.params[6] as number;
    const zoomY = command.params[7] as number;
    const opacity = command.params[8] as number;
    const blendType = command.params[9] as number;

    const xNode = createSpanNode(literal ? x.toString() : `Variable ${x}`, literal ? "value" : "variable");
    const yNode = createSpanNode(literal ? y.toString() : `Variable ${y}`, literal ? "value" : "variable");

    return [
        createTextNode("Move Picture "),
        createSpanNode(id.toString(), "value"),
        createTextNode(' over '),
        createSpanNode(duration, "value"),
        createTextNode(' frames with origin '),
        createSpanNode(origin.toString(), "value"),
        createTextNode(" to ("),
        xNode,
        createTextNode(","),
        yNode,
        createTextNode(") with zoom ("),
        createSpanNode(zoomX.toString(), "value"),
        createTextNode(","),
        createSpanNode(zoomY.toString(), "value"),
        createTextNode("), opacity "),
        createSpanNode(opacity.toString(), "value"),
        createTextNode(", blend type "),
        createSpanNode(blendType.toString(), "value"),
    ];
}

function makeErasePicture(command: EventCommand): Node[] {
    return [
        createTextNode("Erase Picture "),
        createSpanNode(command.params[0], "value"),
    ];
}

function makeChangeTextOptions(command: EventCommand): Node[] {
    return [
        createTextNode("Change Text Options: position = "),
        createSpanNode(command.params[0], "value"),
        createTextNode(", frame = "),
        createSpanNode(command.params[1], "value"),
    ];
}

function makeChangeItems(command: EventCommand): Node[] {
    const item = command.params[0] as number;
    const operation = command.params[1] as number;
    const operandType = command.params[2] as number;
    const operand = command.params[3] as number;

    return [
        createTextNode(operation ? "Increase" : "Decrease"),
        createTextNode(" amount of "),
        itemNode(item),
        createTextNode(" by "),
        varValueNode(operandType, operand),
    ];
}

function makeTransferPlayer(command: EventCommand): Node[] {
    const type = command.params[0] as number;
    return [
        createTextNode("Transfer Player to map "),
        varValueNode(type, command.params[1]),
        createTextNode(" to ("),
        varValueNode(type, command.params[2]),
        createTextNode(","),
        varValueNode(type, command.params[3]),
        createTextNode("), direction "),
        varValueNode(type, command.params[4]),
        createTextNode(" "),
        createTextNode(command.params[5] == 0 ? "with" : "without"),
        createTextNode(" fade"),
    ];
}

function makeSetEventLocation(command: EventCommand): Node[] {
    const appointment = command.params[1] as number;
    if (appointment == 1 || appointment == 2) {
        return [
            createTextNode("Move "),
            characterNode(command.params[0]),
            createTextNode(" to ("),
            varValueNode(appointment, command.params[1]),
            createTextNode(","),
            varValueNode(appointment, command.params[2]),
            createTextNode(")"),
        ];
    } else {
        return [
            createTextNode("Swap "),
            characterNode(command.params[0]),
            createTextNode(" and "),
            characterNode(command.params[2]),
            createTextNode("'s locations"),
        ];
    }
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
