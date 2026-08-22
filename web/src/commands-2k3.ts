import { CODE_TO_VARIABLE_OP } from "./commands";
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
        } else if (eventId == 15) {
          // Begin Document
          context.speaker = {
            name: "0",
            index: 0,
          };
        }
      }

      return result;
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
