import {
  CODE_TO_VARIABLE_OP,
  createVarValueNode,
  createTone,
  CODE_TO_COMPARISON,
} from "./commands";
import type { Context } from "./tree";
import type { EventCommand } from "./types";
import {
  addTooltip,
  createOnOff,
  createSpanNode,
  createValueNode,
  createVariableNode,
  lookupNode,
} from "./utils";

const SYSTEM_SFX = [
  "cursor",
  "decision",
  "cancel",
  "buzzer",
  "begin battle",
  "escape",
  "enemy attacks",
  "enemy damage",
  "ally damage",
  "evasion",
  "enemy kill",
  "use item",
];

const CHARACTER_MAP: Record<number, string> = {
  10001: "player",
  10005: "this event",
};

//
// ALL HOPE ABANDON YE WHO ENTER HERE
//

export function makeCommand2k3(
  command: EventCommand,
  context: Context,
): Node[] {
  // see https://github.com/EasyRPG/Player/blob/master/src/game_interpreter.cpp
  const params = command.params;
  switch (command.code) {
    case 10120: {
      // MessageOptions
      return [
        document.createTextNode("Message Options: transparent = "),
        createValueNode((params[0] != 0).toString()),
        document.createTextNode(", position = "),
        createValueNode(params[1]),
        document.createTextNode(", pos. fixed = "),
        createValueNode((params[2] == 0).toString()),
        document.createTextNode(", continue events = "),
        createValueNode((params[3] != 0).toString()),
      ];
    }

    case 10130: {
      // ChangeFaceGraphic

      // write context to make the appropriate portrait later
      const name = params.at(-1);
      const index = params[0];
      context.speaker = {
        name: name,
        index: index,
      };

      return [
        document.createTextNode("Change Face Graphic: name = "),
        createValueNode(name),
        document.createTextNode(", index = "),
        createValueNode(index),
        document.createTextNode(", right pos. = "),
        createValueNode((params[1] != 0).toString()),
        document.createTextNode(", flipped = "),
        createValueNode((params[2] != 0).toString()),
      ];
    }

    case 10140: {
      // ShowChoice
      const ul = document.createElement("ul");
      ul.classList.add("choices");
      const choices = (params.at(-1) as string).split("/");
      for (const choice of choices) {
        const li = document.createElement("li");
        li.textContent = choice;
        ul.appendChild(li);
      }
      return [document.createTextNode("Show Choices:"), ul];
    }

    case 10150: {
      // InputNumber
      return [
        document.createTextNode("Input "),
        createValueNode(params[0]),
        document.createTextNode(" digits into "),
        lookupNode(params[1], "vars", context),
      ];
    }

    case 10210: {
      // ControlSwitches
      const result: Node[] = [];
      const mode = params[0] as number;
      const operation = params[3] as number;

      switch (operation) {
        case 0:
        case 1: {
          result.push(document.createTextNode("Turn "));
          break;
        }
        case 2: {
          result.push(document.createTextNode("Flip "));
          break;
        }
      }

      switch (mode) {
        case 0: {
          result.push(lookupNode(params[1], "switches", context));
          break;
        }
        case 1: {
          result.push(lookupNode(params[1], "switches", context));
          result.push(document.createTextNode(".."));
          result.push(lookupNode(params[2], "switches", context));
          break;
        }
        default: {
          console.error("unknown mode" + mode);
          break;
        }
      }

      if (operation != 2) {
        result.push(document.createTextNode(" "));
        result.push(createOnOff(operation == 0));
      }

      return result;
    }

    case 10220: {
      // ControlVariables
      const result: Node[] = [document.createTextNode("Change ")];

      const mode = params[0] as number;
      switch (mode) {
        case 0: {
          // single
          result.push(lookupNode(params[1], "vars", context));
          break;
        }
        case 1: {
          // range
          result.push(document.createTextNode("Variables "));
          result.push(lookupNode(params[1], "vars", context));
          result.push(document.createTextNode(".."));
          result.push(lookupNode(params[2], "vars", context));
          break;
        }
        case 2: {
          // indirect single
          result.push(createSpanNode("Variable(", "variable"));
          result.push(lookupNode(params[1], "vars", context));
          result.push(createSpanNode(")", "variable"));
          break;
        }
        default: {
          console.error("unknown mode " + mode);
        }
      }

      const operand = params[4] as number;
      let valueNodes: Node[] = [];

      switch (operand) {
        case 0: {
          // constant
          valueNodes = [createValueNode(params[5])];
          break;
        }
        case 1: {
          // var direct
          valueNodes = [lookupNode(operand, "vars", context)];
          break;
        }
        case 2: {
          // var indirect
          valueNodes = [
            createSpanNode(`Variable(`, "variable"),
            lookupNode(operand, "vars", context),
            createSpanNode(`)`, "variable"),
          ];
          break;
        }
        case 3: {
          valueNodes = [
            document.createTextNode("random value "),
            createValueNode(params[5]),
            document.createTextNode(".."),
            createValueNode(params[6]),
          ];
          break;
        }
        default: {
          // OS14 doesn't use the rest.
          console.error("unknown operand type " + operand);
          break;
        }
      }

      const operation = CODE_TO_VARIABLE_OP[params[3]];

      result.push(document.createTextNode(` ${operation} `));
      result.push(...valueNodes);
      return result;
    }

    case 10320: {
      // ChangeItems
      const operation = params[0];
      const type = params[1];
      const item = params[2];
      const operandType = params[3];
      const operand = params[4];

      const result: Node[] = [];
      result.push(
        document.createTextNode(operation != 1 ? "Add " : "Subtract "),
      );

      if (operandType == 0) result.push(createValueNode(operand));
      else result.push(lookupNode(operand, "vars", context));

      result.push(document.createTextNode(" of "));

      if (type == 0) result.push(lookupNode(item, "items", context));
      else {
        result.push(document.createTextNode("Item # "));
        result.push(lookupNode(item, "vars", context));
      }

      return result;
    }

    case 10330: {
      // ChangePartyMembers
      const operation = params[0];
      const type = params[1];
      const actor = params[2];

      const result: Node[] = [];
      result.push(document.createTextNode(operation == 0 ? "Add " : "Remove "));

      if (type == 0) result.push(lookupNode(actor, "actors", context));
      else {
        result.push(document.createTextNode("Actor # "));
        result.push(lookupNode(actor, "vars", context));
      }
      result.push(
        document.createTextNode(` ${operation == 0 ? "to" : "from"} party`),
      );

      return result;
    }

    case 10440: {
      // ChangeSkills
      const actorMode = params[0] as number;
      const actor = params[1] as number;
      const remove = params[2] != 0;
      const skillMode = params[3] as number;
      const skill = params[4] as number;

      const result: Node[] = [document.createTextNode("Make ")];

      // god i fucking hate these switches
      switch (actorMode) {
        case 0: {
          // party
          result.push(document.createTextNode("party"));
          break;
        }
        case 1: {
          // hero
          result.push(lookupNode(actor, "actors", context));
          break;
        }
        case 2: {
          // var hero
          result.push(
            document.createTextNode("Actor # "),
            lookupNode(actor, "vars", context),
          );
          break;
        }
      }

      result.push(document.createTextNode(remove ? " unlearn " : " learn "));

      if (skillMode == 0) result.push(lookupNode(skill, "skills", context));
      else {
        result.push(
          document.createTextNode("Skill # "),
          lookupNode(skill, "vars", context),
        );
      }

      return result;
    }

    case 10450: {
      // ChangeEquipment
      const actorMode = params[0] as number;
      const actor = params[1] as number;
      const remove = params[2] != 0;
      const itemType = params[3] as number;
      const item = params[4] as number;

      const result: Node[] = [document.createTextNode("Make ")];

      switch (actorMode) {
        case 0: {
          // party
          result.push(createValueNode("party"));
          break;
        }
        case 1: {
          // hero
          result.push(lookupNode(actor, "actors", context));
          break;
        }
        case 2: {
          // var hero
          result.push(
            document.createTextNode("Actor # "),
            lookupNode(actor, "vars", context),
          );
          break;
        }
      }

      result.push(document.createTextNode(remove ? " unequip " : " equip "));

      if (remove) {
        let slot = "";
        switch (itemType) {
          case 0:
            slot = "weapon";
            break;
          case 1:
            slot = "shield";
            break;
          case 2:
            slot = "armor";
            break;
          case 3:
            slot = "helmet";
            break;
          case 4:
            slot = "accessory";
            break;
          case 5:
            slot = "all";
            break;
        }
        result.push(createValueNode(slot));
      } else {
        if (itemType == 0) result.push(lookupNode(item, "items", context));
        else {
          result.push(
            document.createTextNode("Item # "),
            lookupNode(item, "vars", context),
          );
        }
      }

      return result;
    }

    case 10630: {
      // ChangeSpriteAssociation
      return [
        document.createTextNode("Change "),
        lookupNode(params[0], "actors", context),
        document.createTextNode(`'s sprite to "`),
        createValueNode(params.at(-1)),
        document.createTextNode('", index = '),
        createValueNode(params[1]),
        document.createTextNode(", transparent "),
        createOnOff(params[2] != 0),
      ];
    }

    case 10670: {
      // ChangeSystemSFX
      const sfxCtx = SYSTEM_SFX[params[0]];
      const file = createValueNode(params.at(-1));
      if (file.textContent == "_func") {
        const tooltip = addTooltip(
          file,
          "Call internal function specified by variable ",
        ) as HTMLSpanElement;
        tooltip.append(createVariableNode("func"));
        tooltip.style.color = "white";
      } else if (file.textContent == "_init") {
        const tooltip = addTooltip(
          file,
          "Call internal initialization routine",
        ) as HTMLSpanElement;
        tooltip.style.color = "white";
      }

      return [
        document.createTextNode("Change System SFX "),
        createValueNode(sfxCtx),
        document.createTextNode(' to "'),
        file,
        document.createTextNode('" with volume '),
        createValueNode(params[1]),
        document.createTextNode(", tempo "),
        createValueNode(params[2]),
        document.createTextNode(", balance "),
        createValueNode(params[3]),
      ];
    }

    case 10680: {
      // ChangeSystemGraphics
      return [
        document.createTextNode('Change System Graphics to "'),
        createValueNode(params.at(-1)),
        document.createTextNode('", '),
        createValueNode(`${params[0] == 0 ? "stretch" : "tiled"}`),
        document.createTextNode(", font "),
        createValueNode(`${params[1] == 0 ? "gothic" : "mincho"}`),
      ];
    }

    case 10740: {
      // EnterHeroName
      return [
        document.createTextNode("Enter Name for "),
        lookupNode(params[0], "actors", context),
        document.createTextNode(", charset = "),
        createValueNode(params[1]),
        document.createTextNode(", use default name = "),
        createOnOff(params[2] == 1),
      ];
    }

    case 10810: {
      // Teleport
      return [
        document.createTextNode('Teleport player to map "'),
        lookupNode(params[0], "map", context),
        document.createTextNode('" to ('),
        createValueNode(params[1]),
        document.createTextNode(","),
        createValueNode(params[2]),
        document.createTextNode("), direction = "),
        lookupNode((params[3] ?? 0) - 1, "dir", context), // TODO: verify
      ];
    }

    case 10820: {
      // MemorizeLocation
      return [
        document.createTextNode("Memorize Location, storing map -> "),
        lookupNode(params[0], "vars", context),
        document.createTextNode(", x -> "),
        lookupNode(params[1], "vars", context),
        document.createTextNode(", y -> "),
        lookupNode(params[2], "vars", context),
      ];
    }

    case 10830: {
      // RecallToLocation
      return [
        document.createTextNode("Recall Player's Location: map <- "),
        lookupNode(params[0], "vars", context),
        document.createTextNode(", x <- "),
        lookupNode(params[1], "vars", context),
        document.createTextNode(", y <- "),
        lookupNode(params[2], "vars", context),
      ];
    }

    case 10860: {
      // ChangeEventLocation
      const result: Node[] = [
        document.createTextNode("Change Location of Event "),
        createValueNode(params[0]),
        document.createTextNode(" to ("),
        createVarValueNode(params[1], params[2], context),
        document.createTextNode(","),
        createVarValueNode(params[1], params[2], context),
        document.createTextNode("), direction = "),
        lookupNode((params[4] ?? 0) - 1, "dir", context),
      ];
      return result;
    }

    case 11010: {
      // EraseScreen
      return [
        document.createTextNode("Erase Screen with transition "),
        createValueNode(params[0]),
      ];
    }

    case 11020: {
      // ShowScreen
      return [
        document.createTextNode("Show Screen with transition "),
        createValueNode(params[0]),
      ];
    }

    case 11030: {
      // TintScreen
      return [
        document.createTextNode("Tint Screen to "),
        ...createTone({
          red: params[0],
          green: params[1],
          blue: params[2],
          saturation: params[3],
        }),
        document.createTextNode(" over "),
        createValueNode(params[4]),
        document.createTextNode(" seconds, wait = "),
        createOnOff(params[5] != 0),
      ];
    }

    case 11040: {
      // FlashScreen
      const mode = params[6] ?? 0;
      let text = "";
      switch (mode) {
        case 0:
          text = "Flash Screen once to ";
          break;
        case 1:
          text = "Begin Screen Flash to ";
          break;
        case 2:
          text = "End Screen Flash";
          break;
      }

      const result: Node[] = [document.createTextNode(text)];
      if (mode != 2) {
        result.push(
          ...createTone({
            red: params[0],
            green: params[1],
            blue: params[2],
            saturation: params[3],
          }),
          document.createTextNode(" over "),
          createValueNode((params[4] * 0.1).toString()),
          document.createTextNode(" seconds, wait = "),
          createOnOff(params[5] != 0),
        );
      }
      return result;
    }

    case 11050: {
      // ShakeScreen
      return [
        document.createTextNode("Shake Screen with strength "),
        createValueNode(params[0]),
        document.createTextNode(", speed "),
        createValueNode(params[1]),
        document.createTextNode(" over "),
        createValueNode((params[2] * 0.1).toString()),
        document.createTextNode(" seconds, wait = "),
        createOnOff(params[3] != 0),
      ];
    }

    case 11060: {
      // break;
      // PanScreen
      const cmd = params[0];
      const direction = params[1];
      const distance = params[2];
      const speed = params[3];
      const waitingPanScreen = params[4] != 0;
      switch (cmd) {
        case 0:
          // lock
          return [document.createTextNode("Lock Pan")];
        case 1:
          // unlock
          return [document.createTextNode("Unlock Pan")];
        case 2:
          // pan
          return [
            document.createTextNode("Pan Screen "),
            lookupNode(direction, "dir", context),
            document.createTextNode(" with distance "),
            createValueNode(distance),
            document.createTextNode(", speed "),
            createValueNode(speed),
            document.createTextNode(", waiting pan screen = "),
            createOnOff(waitingPanScreen),
          ];
        case 3:
          // reset
          return [
            document.createTextNode("Reset Screen Pan speed to "),
            createValueNode(speed),
          ];
      }
      return [];
    }

    case 11110: {
      // ShowPicture
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "More details";
      details.appendChild(summary);

      const list = document.createElement("ul");
      const items = [
        [document.createTextNode("Fixed to map: "), createOnOff(params[4] > 0)],
        [
          document.createTextNode("Magnify width: "),
          createValueNode(params[5]),
        ],
        [
          document.createTextNode("Magnify height: "),
          createValueNode(params[5]),
        ],
        [document.createTextNode("Top transparency: "), createOnOff(params[6])],
        [
          document.createTextNode("Use transparent color: "),
          createOnOff(params[7] > 0),
        ],
        [createSpanNode(`Red: ${params[8]}`, "color1")],
        [createSpanNode(`Green: ${params[9]}`, "color2")],
        [createSpanNode(`Blue: ${params[10]}`, "color4")],
        [createSpanNode(`Saturation: ${params[11]}`, "color7")],
        [document.createTextNode("Effect mode: "), createValueNode(params[12])],
        [
          document.createTextNode("Effect power: "),
          createValueNode(params[13]),
        ],
        [
          document.createTextNode("Bottom transparency:"),
          createValueNode(params[14]),
        ],
      ];

      for (const item of items) {
        const li = document.createElement("li");
        li.append(...item);
        list.appendChild(li);
      }
      details.appendChild(list);

      return [
        document.createTextNode("Show Picture "),
        createValueNode(params[0]),
        document.createTextNode(' "'),
        createValueNode(params.at(-1)),
        document.createTextNode('" at ('),
        createVarValueNode(params[1], params[2], context),
        document.createTextNode(","),
        createVarValueNode(params[1], params[3], context),
        document.createTextNode(")"),
        details,
      ];
    }

    case 11120: {
      // MovePicture
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "More details";
      details.appendChild(summary);

      const list = document.createElement("ul");
      const items = [
        [
          document.createTextNode("Magnify width: "),
          createValueNode(params[5]),
        ],
        [
          document.createTextNode("Magnify height: "),
          createValueNode(params[5]),
        ],
        [document.createTextNode("Top transparency: "), createOnOff(params[6])],
        [createSpanNode(`Red: ${params[8]}`, "color1")],
        [createSpanNode(`Green: ${params[9]}`, "color2")],
        [createSpanNode(`Blue: ${params[10]}`, "color4")],
        [createSpanNode(`Saturation: ${params[11]}`, "color7")],
        [document.createTextNode("Effect mode: "), createValueNode(params[12])],
        [
          document.createTextNode("Effect power: "),
          createValueNode(params[13]),
        ],
        [document.createTextNode("Duration: "), createValueNode(params[14])],
      ];

      for (const item of items) {
        const li = document.createElement("li");
        li.append(...item);
        list.appendChild(li);
      }
      details.appendChild(list);

      return [
        document.createTextNode("Move Picture "),
        createValueNode(params[0]),
        document.createTextNode(" to ("),
        createVarValueNode(params[1], params[2], context),
        document.createTextNode(","),
        createVarValueNode(params[1], params[3], context),
        document.createTextNode(")"),
        details,
      ];
    }

    case 11130: {
      return [
        document.createTextNode("Erase Picture "),
        createValueNode(params[0]),
      ];
    }

    case 11210: {
      // ShowBattleAnimation
      return [
        document.createTextNode("Show Battle Animation "),
        createValueNode(params[0]),
        document.createTextNode(" for Event "),
        createValueNode(CHARACTER_MAP[params[1]] ?? params[1]),
        document.createTextNode(", waiting battle anim = "),
        createOnOff(params[2] > 0),
        document.createTextNode(", global = "),
        createOnOff(params[3] > 0),
      ];
    }

    case 11330: {
      // MoveEvent
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "Move Route";
      details.appendChild(summary);

      const list = document.createElement("ul");
      {
        const li = document.createElement("li");
        li.append("Move frequency: ", createValueNode(params[1]));
        list.appendChild(li);
      }
      {
        const li = document.createElement("li");
        li.append("Repeat: ", createOnOff(params[2]));
        list.appendChild(li);
      }
      {
        const li = document.createElement("li");
        li.append("Skippable: ", createOnOff(params[3]));
        list.appendChild(li);
      }
      {
        const li = document.createElement("li");
        const route = JSON.stringify(params.slice(4));
        li.textContent = "Commands: " + route.substring(1, route.length - 1);
        list.appendChild(li);
      }
      details.appendChild(list);

      return [
        document.createTextNode("Move Event "),
        createValueNode(CHARACTER_MAP[params[0]] ?? params[0]),
        details,
      ];
    }

    case 11510: {
      // PlayBGM
      return [
        document.createTextNode('Play BG Music "'),
        createValueNode(params.at(-1)),
        document.createTextNode('", fade in over '),
        createValueNode(params[0]),
        document.createTextNode(" ms, volume "),
        createValueNode(params[1]),
        document.createTextNode(", tempo "),
        createValueNode(params[2]),
        document.createTextNode(", balance "),
        createValueNode(params[3]),
      ];
    }

    case 11520: {
      // FadeOutBGM
      return [
        document.createTextNode("Fade Out BG Music over "),
        createValueNode(params[0]),
        document.createTextNode(" ms"),
      ];
    }

    case 11550: {
      // PlaySound
      return [
        document.createTextNode('Play Sound "'),
        createValueNode(params.at(-1)),
        document.createTextNode('", volume '),
        createValueNode(params[0]),
        document.createTextNode(", tempo "),
        createValueNode(params[1]),
        document.createTextNode(", balance "),
        createValueNode(params[2]),
      ];
    }

    // i'm sorry, i'm not parsing this bullshit. if you're interested,
    // see https://github.com/EasyRPG/Player/blob/212f3466c9f276ff7cade5a5ead78d3a151343ac/src/game_interpreter.cpp#L3282
    case 11610: {
      // KeyInputProc
      const a = document.createElement("a");
      a.textContent = "(?)";
      a.title = "Subject yourself to the horrors of the original C++ method";
      a.href =
        "https://github.com/EasyRPG/Player/blob/212f3466c9f276ff7cade5a5ead78d3a151343ac/src/game_interpreter.cpp#L3282";
      return [
        document.createTextNode(
          "Key Input Processing: " + JSON.stringify(params) + " ",
        ),
        a,
      ];
    }

    case 11720: {
      // ChangePBG
      return [
        document.createTextNode('Change Parallax BG to "'),
        createValueNode(params.at(-1)),
        document.createTextNode('", scroll horz = '),
        createOnOff(params[0] != 0),
        document.createTextNode(", vert = "),
        createOnOff(params[1] != 0),
        document.createTextNode(", horz auto = "),
        createOnOff(params[2] != 0),
        document.createTextNode(", horz speed = "),
        createValueNode(params[3]),
        document.createTextNode(", vert auto = "),
        createOnOff(params[4] != 0),
        document.createTextNode(", vert speed = "),
        createValueNode(params[5]),
      ];
    }

    case 11960: {
      // ChangeMainMenuAccess
      return [
        document.createTextNode("Set Allow Main Menu "),
        createOnOff(params[0] != 0),
      ];
    }

    case 12010: {
      // ConditionalBranch
      // (only codes used by OS14 are implemented)
      const result: Node[] = [document.createTextNode("If ")];
      switch (params[0]) {
        case 0: {
          // switch
          result.push(
            lookupNode(params[1], "switches", context),
            document.createTextNode(" is "),
            createOnOff(params[2] == 0),
          );
          break;
        }
        case 1: {
          // variable
          const val1 = lookupNode(params[1], "vars", context);
          const val2 = createVarValueNode(params[2], params[3], context);
          const comp = ` ${CODE_TO_COMPARISON[params[4]]} `;
          result.push(val1, document.createTextNode(comp), val2);
          break;
        }
        case 4: {
          // item
          const hasText = params[2] == 0 ? "has " : "does not have ";
          result.push(
            document.createTextNode("party "),
            document.createTextNode(hasText),
            lookupNode(params[1], "items", context),
          );
          break;
        }
        case 5: {
          // hero
          const actor = lookupNode(params[1], "actors", context);
          result.push(actor);
          switch (params[2]) {
            case 0:
              // in party
              result.push(document.createTextNode(" is in party"));
              break;
            case 4:
              // has skill
              result.push(
                document.createTextNode(" has learned skill "),
                lookupNode(params[3], "skills", context),
              );
              break;
            case 5:
              // has item equipped
              result.push(
                document.createTextNode(" has "),
                lookupNode(params[3], "items", context),
                document.createTextNode(" equipped"),
              );
              break;
          }
          break;
        }
        case 6: {
          // orientation of char
          result.push(
            document.createTextNode("Character "),
            document.createTextNode(CHARACTER_MAP[params[1]] ?? params[1]),
            document.createTextNode(" is facing "),
            lookupNode(params[2], "dir", context),
          );
          break;
        }
        case 8: {
          // "key decision initiated this event"
          result.push(document.createTextNode("triggered by decision key"));
          break;
        }
      }
      result.push(document.createTextNode(":"));
      return result;
    }

    case 11340: {
      // ProceedWithMovement
      return [document.createTextNode("Proceed with Movement")];
    }

    case 11350: {
      // HaltAllMovement
      return [document.createTextNode("Halt All Movement")];
    }

    case 11410: {
      // Wait
      return [
        document.createTextNode("Wait "),
        createValueNode((params[0] * 0.1).toString()),
        document.createTextNode(" seconds"),
      ];
    }

    case 12110: {
      // Label
      return [document.createTextNode("Label "), createValueNode(params[0])];
    }

    case 12120: {
      // JumpToLabel
      return [
        document.createTextNode("Jump to Label "),
        createValueNode(params[0]),
      ];
    }

    case 12210: {
      // BeginLoop
      return [document.createTextNode("Begin Loop")];
    }

    case 12220: {
      // BreakLoop
      return [document.createTextNode("Break Loop")];
    }

    case 12320: {
      // EraseEvent
      return [document.createTextNode("Erase Event")];
    }

    case 12330: {
      // CallEvent
      const eventType = params[0] as number;
      const eventId = params[1] as number;
      const eventPage = params[2] as number;

      const result: Node[] = [document.createTextNode("Call ")];
      switch (eventType) {
        case 0: {
          // common event
          result.push(
            document.createTextNode("Common Event "),
            createValueNode(eventId.toString()),
          );
          break;
        }
        case 1: {
          // map event
          result.push(
            document.createTextNode("Map Event "),
            createValueNode(eventId.toString()),
            document.createTextNode(", page "),
            createValueNode(eventPage.toString()),
          );
          break;
        }
        case 2: {
          // indirect
          result.push(
            document.createTextNode("Map Event # "),
            lookupNode(eventId, "vars", context),
            document.createTextNode(", page "),
            lookupNode(eventPage, "vars", context),
          );
        }
      }

      // Special handling for speaker names
      if (eventType == 0) {
        if (eventType == 0 && eventId == 15) {
          // Begin Narration
          context.speaker = {
            name: "narrator",
            index: 0,
          };
        } else if (eventId == 28) {
          // Begin Document
          context.speaker = {
            name: "0",
            index: 0,
          };
        }
      }

      return result;
    }

    case 12510: {
      // ReturnToTitleScreen
      return [document.createTextNode("Return to Title Screen")];
    }

    case 20140: {
      // ShowChoiceOption
      return [
        document.createTextNode('If choice is "'),
        createSpanNode(params.at(-1), "value"),
        document.createTextNode('":'),
      ];
    }

    case 22010: {
      // ElseBranch
      return [document.createTextNode("Else:")];
    }

    default: {
      return [
        document.createTextNode(
          `Command ${command.code}: ${JSON.stringify(command.params)}`,
        ),
      ];
    }
  }
}
