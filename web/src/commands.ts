import { makeCommand2k3 } from "./commands-2k3";
import type { Context } from "./tree";
import type { AudioFile, EventCommand } from "./types";
import { addTooltip, createSpanNode, lookupNode } from "./utils";

const CODE_TO_COMPARISON: { [key: number]: string } = {
  0: "==",
  1: ">=",
  2: "<=",
  3: ">",
  4: "<=",
  5: "!=",
};

export const CODE_TO_VARIABLE_OP: { [key: number]: string } = {
  0: "=",
  1: "+=",
  2: "-=",
  3: "*=",
  4: "/=",
  5: "%=",
};

export function createVarValueNode(
  type: number,
  operand: number,
  context: Context,
): Node {
  return type == 0
    ? createSpanNode(operand.toString(), "value")
    : lookupNode(operand, "vars", context);
}

type Tone = {
  red: number;
  green: number;
  blue: number;
  gray?: number;
  alpha?: number;
};

function makeTone(tone: Tone): Node[] {
  const red = createSpanNode(`R:${tone.red}`, "color1");
  const green = createSpanNode(`G:${tone.green}`, "color2");
  const blue = createSpanNode(`B:${tone.blue}`, "color4");

  let gray: HTMLSpanElement | null = null;
  if (tone.gray) gray = createSpanNode(`g:${tone.gray}`, "color7");

  let alpha: HTMLSpanElement | null = null;
  if (tone.alpha) alpha = createSpanNode(`g:${tone.alpha}`, "color7");

  addTooltip(red, `Red = ${tone.red}`);
  addTooltip(green, `Green = ${tone.green}`);
  addTooltip(blue, `Blue = ${tone.blue}`);
  if (gray) addTooltip(gray, `Gray = ${tone.gray}`);
  if (alpha) addTooltip(alpha, `Alpha = ${tone.alpha}`);

  const result: Node[] = [
    red,
    document.createTextNode(", "),
    green,
    document.createTextNode(", "),
    blue,
  ];
  if (gray) {
    result.push(document.createTextNode(", "));
    result.push(gray);
  }
  if (alpha) {
    result.push(document.createTextNode(", "));
    result.push(alpha);
  }
  return result;
}

export function makeCommand(
  command: EventCommand,
  context: Context,
): Node | Node[] {
  // see https://github.com/elizagamedev/mkxp-oneshot/blob/master/scripts/Interpreter_2.rb
  const params = command.params;
  if (command.code != 10110 && command.code > 10000)
    return makeCommand2k3(command, context);
  switch (command.code) {
    case 101:
    case 10110:
      return makeDialogueBox(command, context);
    case 106: {
      return [
        document.createTextNode("Wait "),
        createSpanNode(params[0] as string, "value"),
        document.createTextNode(" frames"),
      ];
    }
    case 102:
      return makeShowChoices(command);
    case 103: // Input Number
      return [
        document.createTextNode("Input Number into "),
        lookupNode(params[0] as number, "vars", context),
        document.createTextNode(" with max digits = "),
        lookupNode(params[1] as number, "vars", context),
      ];
    case 104:
      return makeChangeTextOptions(command);
    case 105: // Button Input Processing
      return [
        document.createTextNode("Button Input Processing for button = "),
        createSpanNode(params[0] as string, "value"),
      ];
    case 111:
      return makeCondition(command, context);
    case 112:
      return document.createTextNode("Loop");
    case 113:
      return document.createTextNode("Break Loop");
    case 115:
      return document.createTextNode("Exit Event Processing");
    case 116:
      return document.createTextNode("Erase Event");
    case 117:
      return makeCallCommonEvent(command);
    case 118: // Label
      return [
        document.createTextNode('Label "'),
        createSpanNode(params[0] as string, "value"),
        document.createTextNode('"'),
      ];
    case 119: // Jump to Label
      return [
        document.createTextNode('Jump to Label "'),
        createSpanNode(params[0] as string, "value"),
        document.createTextNode('"'),
      ];
    case 121:
      return makeControlSwitches(command, context);
    case 122:
      return makeControlVariables(command, context);
    case 123:
      return makeControlSelfSwitch(command);
    case 126: // Change Items
      return makeChangeItems(command, context);
    case 129: {
      // Change Party Member
      const add = params[1] == 0;
      const result = [
        document.createTextNode(add ? "Add " : "Remove "),
        lookupNode(params[0] as number, "actors", context),
        document.createTextNode(add ? " to party" : " from party"),
      ];
      if (add) {
        result.push(
          document.createTextNode(params[2] == 1 ? " with" : " without"),
          document.createTextNode(" setup"),
        );
      }
      return result;
    }
    case 131: // Change Windowskin
      return [
        document.createTextNode('Change Windowskin to "'),
        createSpanNode(params[0] as string, "value"),
        document.createTextNode('"'),
      ];
    case 201:
      return makeTransferPlayer(command, context);
    case 202:
      return makeSetEventLocation(command, context);
    case 203:
      return makeScrollMap(command, context);
    case 204:
      return makeChangeMapSettings(command);
    case 207:
      return makeShowAnimation(command, context);
    case 209:
      return makeSetMoveRoute(command, context);
    case 210:
      return document.createTextNode("Wait for Move's Completion");
    case 221:
      return document.createTextNode("Prepare for Transition");
    case 222: // Execute Transition
      return [
        document.createTextNode('Execute Transition "'),
        createSpanNode(params[0] as string, "value"),
        document.createTextNode('"'),
      ];
    case 223: {
      // Change Screen Color Tone
      const tone = params[0];
      return [
        document.createTextNode("Change Screen Color Tone to "),
        ...makeTone(tone),
        document.createTextNode(" over "),
        createSpanNode(params[1] as string, "value"),
        document.createTextNode(" frames"),
      ];
    }
    case 224: // Screen Flash
      return [
        document.createTextNode("Start Screen Flash to color "),
        ...makeTone(params[0]),
        document.createTextNode(" over "),
        createSpanNode(params[1] as string, "value"),
        document.createTextNode(" frames"),
      ];
    case 225: // Screen Shake
      return [
        document.createTextNode("Start Screen Shake, power "),
        createSpanNode(params[0] as string, "value"),
        document.createTextNode(", speed "),
        createSpanNode(params[1] as string, "value"),
        document.createTextNode(", duration "),
        createSpanNode(params[2] as string, "value"),
        document.createTextNode(" frames"),
      ];
    case 231:
      return makeShowPicture(command, context);
    case 232:
      return makeMovePicture(command, context);
    case 234: // Change Picture Color Tone
      return [
        document.createTextNode("Change Picture "),
        createSpanNode(params[0] as string, "value"),
        document.createTextNode("'s tone to "),
        ...makeTone(params[1]),
        document.createTextNode(" over "),
        createSpanNode(params[2] as string, "value"),
        document.createTextNode(" frames"),
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
      return document.createTextNode("Memorize BG Music/Sound");
    case 248:
      return document.createTextNode("Restore BG Music/Sound");
    case 249:
      return makePlayMe(command);
    case 250:
      return makePlaySe(command);
    case 251:
      return [document.createTextNode("Stop Sound Effect")];
    case 322:
      return [
        document.createTextNode("Change Actor Graphic of "),
        lookupNode(params[0] as number, "actors", context),
        document.createTextNode(' to "'),
        createSpanNode(params[1] as string, "value"),
        document.createTextNode('", hue '),
        createSpanNode(params[2] as string, "value"),
      ];
    case 352:
      return [document.createTextNode("Call Save Screen")];
    case 355:
      return makeScript(command, context);
    case 402:
      return makeWhenChoice(command);
    case 403:
      return document.createTextNode("Cancel Choice");
    case 411:
      return document.createTextNode("Else:");
    case 413:
      return document.createTextNode("Repeat Above");
    default:
      console.error(`Unknown command code ${command.code}`);
      return makeUnknown(command);
  }
}

function makePortrait(face: string, addLabel: boolean): HTMLElement {
  const root = document.createElement("div");
  root.classList.add("portrait-container");

  const image = new Image();
  const file = face.substring(1).toLowerCase();
  image.classList.add("portrait");
  image.src = `faces/${file}.png`;
  if (addLabel) image.title = face;
  root.appendChild(image);

  if (addLabel) {
    const label = document.createElement("span");
    label.classList.add("portrait-label");
    label.textContent = face;
    root.appendChild(label);
  }

  return root;
}

function makeDialogueBox(command: EventCommand, context: Context): HTMLElement {
  const root = document.createElement("div");

  const rawText = command.params[0] as string;
  let text: string = rawText;

  let face: string = "";
  if (context.is2k3 && context.speaker) {
    face = "@os14/" + context.speaker.name + context.speaker.index;
  }

  let note = false;
  if (rawText.startsWith("@")) {
    let space = rawText.indexOf(" ");
    if (space < 0) space = rawText.length;
    face = rawText.substring(0, space);
    text = rawText.substring(space + 1);
  } else if (rawText.startsWith("$") || face === "@os14/00") {
    root.classList.add("note");
    note = true;
    if (!context.is2k3) text = rawText.substring(1);
  }

  if (face === "@ed" || face === "@os14/narrator0") {
    root.classList.add("ed-speak");
  } else if (face === "@desktop") {
    root.classList.add("desktop");
  } else if (face === "@credits") {
    root.classList.add("credits");
  } else if (!note) {
    root.classList.add("dialogue-box");
    if (face) {
      const portrait = makePortrait(face, !context.is2k3);
      root.appendChild(portrait);
    }
  }

  const content = document.createElement("div");
  content.append(...parseEscapes(text, context));
  root.appendChild(content);

  return root;
}

function parseEscapes(raw: string, context: Context): Node[] {
  const is2k3 = context.is2k3;
  const result: Node[] = [];
  let color = 0;
  let start = 0;
  let end = 0;

  raw = raw.replaceAll("’", "'"); // HACK: workaround until the preprocesor is updated
  if (context.is2k3) {
    raw = raw.replaceAll("_PlayerName_xxxxxxxxxxxxxxxxxxxx", "\\p");
    raw = raw.replaceAll("_PlayerName_guess_xxxxxxxxxxxxxx", "\\p");
  }

  function flush() {
    const text = raw.substring(start, end);
    if (!text) return;
    const span = document.createElement("span");
    span.textContent = text;
    if (color != 0) {
      span.classList.add(`color${color}`);
    }
    start = end;
    result.push(span);
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
        case "!": {
          result.push(makeInlineWait("!"));
          break;
        }
        case ">": {
          if (is2k3) console.error("> 2k3 escape");
          else result.push(makeInlineWait(">"));
          break;
        }
        case "<": {
          console.error("< 2k3 escape");
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
        case "c": {
          color = parseInt(raw[end + 1]);
          end += 3;
          start = end;
          break;
        }
        case "v": {
          const index = parseInt(raw[end + 1]);
          end += 3;
          start = raw.indexOf("]", start + 1) + 1;
          result.push(makeInlineVariable(index, color, context));
          break;
        }
        case "l":
        case "r":
        case "h": {
          // these are too complex to handle here. leaving them out for now.
          // align = (c == "l" ? "left" : "right");
          result.push(document.createTextNode("\\"));
          end -= 1;
          start = end;
          break;
        }
        default: {
          console.error("Unknown escape sequence: " + c);
          result.push(document.createTextNode("\\"));
          end -= 1;
          start = end;
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
  addTooltip(root, "Short Pause");
  return root;
}

function makeInlineLongPause(): HTMLElement {
  const root = document.createElement("span");
  root.classList.add("inline", "inline-longpause");
  root.textContent = "|";
  addTooltip(root, "Long Pause");
  return root;
}

function makeInlineWait(label: string): HTMLElement {
  const root = document.createElement("span");
  root.classList.add("inline", "inline-wait");
  root.textContent = label;
  addTooltip(root, "Wait for Action");
  return root;
}

function makeInlinePortraitChange(face: string): HTMLElement {
  const root = document.createElement("span");
  root.classList.add("inline", "inline-change");
  root.textContent = "@";

  const portrait = makePortrait(face, true);
  portrait.insertBefore(
    createSpanNode("Set portrait:", "tooltip-text"),
    portrait.firstChild,
  );
  addTooltip(root, portrait);

  return root;
}

function makeInlineVariable(
  index: number,
  color: number,
  context: Context,
): HTMLElement {
  let varName = context.misc.vars[index];
  if (!varName) varName = `Variable ${index}`;
  const root = document.createElement("span");
  root.classList.add("inline", "inline-var", `color${color}`);
  root.textContent = "v";
  root.title = `Value of ${varName}`;
  return root;
}

function makeCondition(command: EventCommand, context: Context): Node[] {
  // see https://github.com/elizagamedev/mkxp-oneshot/blob/87819a0f6613befaf295eb0d6a09c19e29931e47/scripts/Interpreter_3.rb#L228
  const result: Node[] = [];
  result.push(document.createTextNode("If "));
  const type: number = command.params[0];
  let addColon = true;
  switch (type) {
    case 0: {
      // switch
      result.push(lookupNode(command.params[1], "switches", context));
      result.push(document.createTextNode(" is "));

      const onSpan = document.createElement("span");
      const on = command.params[2] == 0 ? "on" : "off";
      onSpan.classList.add(on);
      onSpan.textContent = on.toUpperCase();
      result.push(onSpan);
      break;
    }
    case 1: {
      // variable
      result.push(lookupNode(command.params[1], "vars", context));

      result.push(
        document.createTextNode(
          ` ${CODE_TO_COMPARISON[command.params[4] as number]} `,
        ),
      );

      result.push(
        createVarValueNode(command.params[2], command.params[3], context),
      );
      break;
    }
    case 2: {
      // self switch
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
    case 4: {
      // actor
      const actor = command.params[1] as number;
      const type = command.params[2] as number;
      if (type == 0) {
        // in party
        result.push(lookupNode(actor, "actors", context));
        result.push(document.createTextNode(" is in party"));
      } else {
        console.error("Unknown actor check type: " + type);
        result.push(
          document.createTextNode(`actor check type ${type} on actor ${actor}`),
        );
      }
      break;
    }
    case 6: {
      result.push(lookupNode(command.params[1], "actors", context));
      result.push(document.createTextNode("'s direction is "));
      result.push(lookupNode(command.params[2], "dir", context));
      break;
    }
    case 8: {
      // item
      result.push(document.createTextNode("player has "));
      result.push(lookupNode(command.params[1], "items", context));
      break;
    }
    case 11: {
      // button
      const span = document.createElement("span");
      span.classList.add("button");
      span.textContent = "Button " + command.params[1];
      result.push(span);
      result.push(document.createTextNode(" is pressed"));
      break;
    }
    case 12: {
      // script
      const span = document.createElement("span");
      span.classList.add("code");
      const code = command.params[1] as string;
      span.textContent = code;
      result.push(span);

      if (code.startsWith("EdText.")) {
        const box = makeEdText(code, context);
        if (box) result.push(box);
      }
      addColon = false;
      break;
    }
    default: {
      console.log(`Unknown condition type ${type}`);
      result.push(document.createTextNode(JSON.stringify(command.params)));
      break;
    }
  }
  if (addColon) result.push(document.createTextNode(":"));
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
    li.innerHTML = li.innerHTML.replaceAll(
      "\\p",
      `<span class="player">Player</span>`,
    );
    choices.appendChild(li);
  }
  root.appendChild(choices);

  return root;
}

function makeWhenChoice(command: EventCommand): Node[] {
  const result: Node[] = [];
  const choice = command.params[1] as string;
  result.push(document.createTextNode('When choice is "'));

  const span = createSpanNode(choice, "choice");
  span.innerHTML = span.innerHTML.replaceAll(
    "\\p",
    `<span class="player">Player</span>`,
  );
  result.push(span);

  result.push(document.createTextNode('":'));
  return result;
}

function makeScript(command: EventCommand, context: Context): Node[] {
  const result: Node[] = [];
  result.push(document.createTextNode("Script: "));
  const code = command.params[0] as string;

  const script = document.createElement("div");
  script.classList.add("code");
  script.textContent = code;
  result.push(script);

  if (code.startsWith("EdText.")) {
    const box = makeEdText(code, context);
    if (box) result.push(box);
  }

  return result;
}

function makeEdText(code: string, context: Context): Node | null {
  const quote = code.indexOf('"');
  if (quote < 0) return null;
  const funcName = code.substring(7, quote - 1);

  const box = document.createElement("div");
  box.classList.add("ed-box");

  const bar = document.createElement("div");
  bar.classList.add("ed-box-bar");
  box.appendChild(bar);

  const title = document.createElement("span");
  title.classList.add("ed-box-ttl");
  bar.appendChild(title);

  const content = document.createElement("div");
  content.classList.add("ed-box-cont");
  box.appendChild(content);

  function makeButton(text: string): Node {
    const btn = document.createElement("div");
    btn.classList.add("ed-box-btn");
    btn.textContent = text;
    return btn;
  }

  const boxBtns = document.createElement("div");
  boxBtns.classList.add("ed-box-btns");

  const text = code.substring(quote + 1, code.lastIndexOf('"'));
  const parts = parseEscapes(text.replaceAll("\\\\", "\\"), context); // only used to handle \p
  const textNode = document.createElement("div");
  textNode.classList.add("ed-box-text");
  textNode.append(...parts);
  content.appendChild(textNode);

  switch (funcName) {
    case "info": {
      box.dataset.type = "info";
      title.textContent = "Info";
      boxBtns.appendChild(makeButton("Ok"));
      break;
    }
    case "yesno": {
      box.title = 'If "Yes" is selected';
      box.dataset.type = "yesno";
      title.textContent = "Question";
      boxBtns.appendChild(makeButton("Yes"));
      boxBtns.appendChild(makeButton("No"));
      break;
    }
    case "err": {
      box.dataset.type = "err";
      title.textContent = "Error";
      boxBtns.appendChild(makeButton("Ok"));
      break;
    }
  }

  content.appendChild(boxBtns);
  return box;
}

function makePlayBgm(command: EventCommand): Node[] {
  const audioFile = command.params[0] as AudioFile;
  return [
    document.createTextNode('Play BG music "'),
    createSpanNode(audioFile.name, "value"),
    document.createTextNode('", volume '),
    createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
    document.createTextNode(", pitch "),
    createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
  ];
}

function makeFadeOutBgm(command: EventCommand): Node[] {
  return [
    document.createTextNode("Fade Out Bacgkround Music over "),
    createSpanNode(command.params[0], "value"),
    document.createTextNode(" seconds"),
  ];
}

function makePlayBgs(command: EventCommand): Node[] {
  const audioFile = command.params[0] as AudioFile;
  return [
    document.createTextNode("Play background sound "),
    createSpanNode(audioFile.name, "value"),
    document.createTextNode('", volume '),
    createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
    document.createTextNode(", pitch "),
    createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
  ];
}

function makeFadeOutBgs(command: EventCommand): Node[] {
  return [
    document.createTextNode("Fade Out Background Sound over "),
    createSpanNode(command.params[0], "value"),
    document.createTextNode(" seconds"),
  ];
}

function makePlaySe(command: EventCommand): Node[] {
  const audioFile = command.params[0] as AudioFile;
  return [
    document.createTextNode('Play Sound Effect "'),
    createSpanNode(audioFile.name, "value"),
    document.createTextNode('", volume '),
    createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
    document.createTextNode(", pitch "),
    createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
  ];
}

function makePlayMe(command: EventCommand): Node[] {
  const audioFile = command.params[0] as AudioFile;
  return [
    document.createTextNode('Play Music Effect "'),
    createSpanNode(audioFile.name, "value"),
    document.createTextNode('", volume '),
    createSpanNode(audioFile.volume?.toString() ?? 1, "value"),
    document.createTextNode(", pitch "),
    createSpanNode(audioFile.pitch?.toString() ?? 1, "value"),
  ];
}

function makeControlSwitches(command: EventCommand, context: Context): Node[] {
  const result: Node[] = [];
  const from: number = command.params[0];
  const to: number = command.params[1];

  if (from === to) {
    result.push(document.createTextNode("Turn "));
    result.push(lookupNode(from, "switches", context));
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

function makeControlVariables(command: EventCommand, context: Context): Node[] {
  const result: Node[] = [];
  result.push(document.createTextNode("Change "));

  const from = command.params[0] as number;
  const to = command.params[1] as number;
  const type = command.params[2] as number;
  const operandType = command.params[3] as number;
  const operand = command.params[4] as number;
  const extra: number | undefined = command.params[5];

  if (from === to) {
    result.push(lookupNode(from, "vars", context));
  } else {
    result.push(document.createTextNode("Variables "));
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
      result.push(lookupNode(operand, "vars", context));
      break;
    case 2: // random
      result.push(document.createTextNode("random value from "));
      result.push(createSpanNode(operand.toString(), "value"));
      result.push(document.createTextNode(" to "));
      result.push(createSpanNode(extra!.toString(), "value"));
      break;
    case 3: // item
      result.push(document.createTextNode(`# of `));
      result.push(lookupNode(operand, "items", context));
      result.push(document.createTextNode(` carried`));
      break;
    case 6: {
      // character
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
      result.push(lookupNode(operand, "actors", context));
      result.push(document.createTextNode(` ${par}`));
      break;
    }
    case 7: {
      // other
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

function makeScrollMap(command: EventCommand, context: Context): Node[] {
  return [
    document.createTextNode("Scroll Map: direction "),
    lookupNode(command.params[0], "dir", context),
    document.createTextNode(", distance "),
    createSpanNode(command.params[1], "value"),
    document.createTextNode(", speed "),
    createSpanNode(command.params[2], "value"),
  ];
}

function makeChangeMapSettings(command: EventCommand): Node[] {
  const type = command.params[0];
  const name = command.params[1];
  const hue = command.params[2];
  const opacity = command.params[3];
  const blendType = command.params[4];
  const zoom = command.params[5];
  const sx = command.params[6];
  const sy = command.params[7];

  switch (type) {
    case 0: {
      // panorama
      return [
        document.createTextNode('Change Panorama to "'),
        createSpanNode(name, "value"),
        document.createTextNode('" with hue '),
        createSpanNode(hue, "value"),
      ];
    }
    case 1: {
      // fog
      return [
        document.createTextNode('Change Fog to "'),
        createSpanNode(name, "value"),
        document.createTextNode('" with hue '),
        createSpanNode(hue, "value"),
        document.createTextNode(", opacity "),
        createSpanNode(opacity, "value"),
        document.createTextNode(", blend type "),
        createSpanNode(blendType, "value"),
        document.createTextNode(", zoom "),
        createSpanNode(zoom, "value"),
        document.createTextNode(", sx "),
        createSpanNode(sx, "value"),
        document.createTextNode(", sy "),
        createSpanNode(sy, "value"),
      ];
    }
    case 2: {
      // battleback
      return [
        document.createTextNode('Change Battleback to "'),
        createSpanNode(name, "value"),
        document.createTextNode('"'),
      ];
    }
    default:
      console.error("Illegal Change Map Settings type: " + type);
      return [];
  }
}

function makeShowAnimation(command: EventCommand, context: Context): Node[] {
  return [
    document.createTextNode("Set "),
    lookupNode(command.params[0], "actors", context),
    document.createTextNode("'s animation ID to "),
    createSpanNode(command.params[1], "value"),
  ];
}

function makeSetMoveRoute(command: EventCommand, context: Context): Node {
  const details = document.createElement("details") as HTMLDetailsElement;
  const summary = document.createElement("summary");
  const content = document.createElement("div");
  content.classList.add("code");
  summary.textContent = "Set Move Route for ";
  summary.appendChild(lookupNode(command.params[0], "actors", context));
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

function makeShowPicture(command: EventCommand, context: Context): Node[] {
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

  const xNode = literal
    ? createSpanNode(x.toString(), "value")
    : lookupNode(x, "vars", context);
  const yNode = literal
    ? createSpanNode(y.toString(), "value")
    : lookupNode(y, "vars", context);

  return [
    document.createTextNode("Show Picture "),
    createSpanNode(id.toString(), "value"),
    document.createTextNode(' "'),
    createSpanNode(name, "value"),
    document.createTextNode('" with origin '),
    createSpanNode(origin.toString(), "value"),
    document.createTextNode(" at ("),
    xNode,
    document.createTextNode(","),
    yNode,
    document.createTextNode(") with zoom ("),
    createSpanNode(zoomX.toString(), "value"),
    document.createTextNode(","),
    createSpanNode(zoomY.toString(), "value"),
    document.createTextNode("), opacity "),
    createSpanNode(opacity.toString(), "value"),
    document.createTextNode(", blend type "),
    createSpanNode(blendType.toString(), "value"),
  ];
}

function makeMovePicture(command: EventCommand, context: Context): Node[] {
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

  const xNode = literal
    ? createSpanNode(x.toString(), "value")
    : lookupNode(x, "vars", context);
  const yNode = literal
    ? createSpanNode(y.toString(), "value")
    : lookupNode(y, "vars", context);

  return [
    document.createTextNode("Move Picture "),
    createSpanNode(id.toString(), "value"),
    document.createTextNode(" over "),
    createSpanNode(duration, "value"),
    document.createTextNode(" frames with origin "),
    createSpanNode(origin.toString(), "value"),
    document.createTextNode(" to ("),
    xNode,
    document.createTextNode(","),
    yNode,
    document.createTextNode(") with zoom ("),
    createSpanNode(zoomX.toString(), "value"),
    document.createTextNode(","),
    createSpanNode(zoomY.toString(), "value"),
    document.createTextNode("), opacity "),
    createSpanNode(opacity.toString(), "value"),
    document.createTextNode(", blend type "),
    createSpanNode(blendType.toString(), "value"),
  ];
}

function makeErasePicture(command: EventCommand): Node[] {
  return [
    document.createTextNode("Erase Picture "),
    createSpanNode(command.params[0], "value"),
  ];
}

function makeChangeTextOptions(command: EventCommand): Node[] {
  return [
    document.createTextNode("Change Text Options: position = "),
    createSpanNode(command.params[0], "value"),
    document.createTextNode(", frame = "),
    createSpanNode(command.params[1], "value"),
  ];
}

function makeChangeItems(command: EventCommand, context: Context): Node[] {
  const item = command.params[0] as number;
  const operation = command.params[1] as number;
  const operandType = command.params[2] as number;
  const operand = command.params[3] as number;

  return [
    document.createTextNode(operation == 0 ? "Increase" : "Decrease"),
    document.createTextNode(" amount of "),
    lookupNode(item, "items", context),
    document.createTextNode(" by "),
    createVarValueNode(operandType, operand, context),
  ];
}

function makeTransferPlayer(command: EventCommand, context: Context): Node[] {
  const result: Node[] = [];
  const type = command.params[0] as number;

  const dirLabel = type == 0 ? "), facing " : "), direction = ";
  const dirLookupType = type == 0 ? "dir" : "vars";
  const mapLookupType = type == 0 ? "map" : "vars";
  const mapQuote = type == 0 ? '"' : "";

  result.push(document.createTextNode(`Transfer Player to map ${mapQuote}`));
  result.push(lookupNode(command.params[1], mapLookupType, context));
  result.push(document.createTextNode(`${mapQuote}, position (`));
  result.push(createVarValueNode(type, command.params[2], context));
  result.push(document.createTextNode(","));
  result.push(createVarValueNode(type, command.params[3], context));
  result.push(document.createTextNode(dirLabel));
  result.push(lookupNode(command.params[4], dirLookupType, context));
  result.push(document.createTextNode(", "));
  result.push(
    document.createTextNode(command.params[5] == 0 ? "with" : "without"),
  );
  result.push(document.createTextNode(" fade"));
  return result;
}

function makeSetEventLocation(command: EventCommand, context: Context): Node[] {
  const appointment = command.params[1] as number;
  if (appointment == 1 || appointment == 2) {
    return [
      document.createTextNode("Move "),
      lookupNode(command.params[0], "actors", context),
      document.createTextNode(" to ("),
      createVarValueNode(appointment, command.params[1], context),
      document.createTextNode(","),
      createVarValueNode(appointment, command.params[2], context),
      document.createTextNode(")"),
    ];
  } else {
    return [
      document.createTextNode("Swap "),
      lookupNode(command.params[0], "actors", context),
      document.createTextNode(" and "),
      lookupNode(command.params[2], "actors", context),
      document.createTextNode("'s locations"),
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
