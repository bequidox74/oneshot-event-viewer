import { makeCommand } from "./commands";
import type {
  CommonEvent,
  CommonEvents,
  EventCommand,
  EventPage,
  MapDefinition,
  MapEvent,
  MiscDefinitions,
  RpgEvent,
} from "./types";
import { createCollapsibleHeading, createSpanNode, lookupNode } from "./utils";

export type Context = {
  misc: MiscDefinitions;
  dialogueOnly: boolean;
};

const DIALOGUE_ONLY_CODES = [101, 102, 106, 111, 355, 411];

export function makeCommonEvents(events: CommonEvents, context: Context): Node {
  const root = document.createElement("div");
  root.id = "common";

  const details = createCollapsibleHeading({
    level: 1,
    name: "Common Events",
  });
  root.appendChild(details);

  for (const event of events) {
    details.appendChild(makeCommonEvent(event, root.id, context));
  }

  return root;
}

export function makeMap(map: MapDefinition, context: Context): Node {
  const root = document.createElement("div");
  root.id = `map${map.id}`;

  const details = createCollapsibleHeading({
    level: 1,
    name: map.name,
    id: map.id,
  });
  root.appendChild(details);

  for (const event of map.events) {
    details.appendChild(makeMapEvent(event, root.id, context));
  }

  return root;
}

function makeCommonEvent(
  event: CommonEvent,
  parentId: string,
  context: Context,
): Node {
  const [root, content] = makeEventBase(event, parentId);

  const info = document.createElement("div");
  info.classList.add("event-info");

  if (event.trigger !== undefined) {
    const span = document.createElement("div");
    span.append(
      document.createTextNode("Trigger: "),
      createSpanNode(event.trigger.toString(), "value"),
    );
    info.appendChild(span);
  }

  if (event.switchId !== undefined) {
    const sid = (event as CommonEvent).switchId;
    const span = document.createElement("div");
    span.append(
      lookupNode(sid, "switches", context),
      document.createTextNode(" is "),
      createSpanNode("ON", "on"),
    );
    info.appendChild(span);
  }

  content.appendChild(info);
  content.appendChild(makeEventCommands(event.commands, context));
  return root;
}

function makeMapEvent(
  event: MapEvent,
  parentId: string,
  context: Context,
): Node {
  const [root, content] = makeEventBase(event, parentId);

  const info = document.createElement("div");
  info.classList.add("event-info");

  const posSpan = document.createElement("div");
  posSpan.append(
    document.createTextNode("Position: ("),
    createSpanNode(event.x.toString(), "value"),
    document.createTextNode(","),
    createSpanNode(event.y.toString(), "value"),
    document.createTextNode(")"),
  );
  info.appendChild(posSpan);

  content.appendChild(info);
  for (const [i, page] of event.pages.entries()) {
    content.appendChild(makePage(page, root.id, i, context));
  }

  return root;
}

function makePage(
  page: EventPage,
  parentId: string,
  index: number,
  context: Context,
): Node {
  const root = document.createElement("div");
  root.id = parentId + `-p${index}`;
  root.classList.add("page");

  const details = createCollapsibleHeading({
    level: 3,
    name: `Page ${index}`,
    linkId: parentId,
  });

  if (page.condition) {
    const container = document.createElement("div");
    container.classList.add("page-cond");

    if (page.condition.switch1) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        lookupNode(page.condition.switch1, "switches", context),
        document.createTextNode(" is "),
        createSpanNode("ON", "on"),
        document.createTextNode(":"),
      );
      container.appendChild(div);
    }

    if (page.condition.switch2) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        lookupNode(page.condition.switch2, "switches", context),
        document.createTextNode(" is "),
        createSpanNode("ON", "on"),
        document.createTextNode(":"),
      );
      container.appendChild(div);
    }

    if (page.condition.selfSwitch) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        createSpanNode(
          `Self Switch ${page.condition.selfSwitch}`,
          "selfswitch",
        ),
        document.createTextNode(" is "),
        createSpanNode("ON", "on"),
        document.createTextNode(":"),
      );
      container.appendChild(div);
    }

    if (page.condition.var && page.condition.value) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        lookupNode(page.condition.var, "vars", context),
        document.createTextNode(" >= "),
        createSpanNode(page.condition.value.toString(), "value"),
        document.createTextNode(":"),
      );
      container.appendChild(div);
    }

    details.appendChild(container);
  }

  details.appendChild(makeEventCommands(page.list, context));
  root.appendChild(details);

  return root;
}

/**
 * @returns Array of [root, content]
 */
function makeEventBase(
  event: RpgEvent,
  parentId: string,
): [HTMLDivElement, HTMLDivElement] {
  const root = document.createElement("div");
  root.id = `${parentId}-e${event.id}`;
  root.classList.add("event");

  const details = createCollapsibleHeading({
    level: 2,
    name: event.name,
    id: event.id,
    linkId: parentId,
  });

  const content = document.createElement("div");
  content.classList.add("event-details");
  details.appendChild(content);

  root.appendChild(details);
  return [root, content];
}

function makeEventCommands(commands: EventCommand[], context: Context): Node {
  const root = document.createElement("div");
  root.classList.add("commands");

  function shouldSkip(code: number): boolean {
    return context.dialogueOnly && !DIALOGUE_ONLY_CODES.includes(code);
  }

  const stack: Node[] = [root];
  for (const command of commands) {
    if (shouldSkip(command.code)) continue;
    const newLevel = command.indent ?? 0;

    while (stack.length > newLevel + 1) {
      stack.pop();
    }

    const commandDiv = document.createElement("div");
    commandDiv.classList.add("command");
    const result = makeCommand(command, context);
    if (Array.isArray(result)) commandDiv.append(...result);
    else commandDiv.append(result);

    stack.at(-1)!.appendChild(commandDiv);
    stack.push(commandDiv);
  }

  return root;
}
