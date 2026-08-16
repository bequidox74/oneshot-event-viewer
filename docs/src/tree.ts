import { makeCommand } from "./commands";
import type {
  CommonEvent,
  CommonEvents,
  EventCommand,
  EventPage,
  MapDefinition,
  MapEvent,
  RpgEvent,
} from "./types";
import { createCollapsibleHeading, createSpanNode } from "./utils";

export function makeCommonEvents(events: CommonEvents): Node {
  const root = document.createElement("div");
  root.id = "common";

  const details = createCollapsibleHeading({
    level: 1,
    name: "Common Events",
  });
  root.appendChild(details);

  for (const event of events) {
    details.appendChild(makeCommonEvent(event, root.id));
  }

  return root;
}

export function makeMap(map: MapDefinition): Node {
  const root = document.createElement("div");
  root.id = `map${map.id}`;

  const details = createCollapsibleHeading({
    level: 1,
    name: map.name,
    id: map.id,
  });
  root.appendChild(details);

  for (const event of map.events) {
    details.appendChild(makeMapEvent(event, root.id));
  }

  return root;
}

function makeCommonEvent(event: CommonEvent, parentId: string): Node {
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
      createSpanNode(`Switch ${sid}`, "switch"),
      document.createTextNode(" is "),
      createSpanNode("ON", "on"),
    );
    info.appendChild(span);
  }

  content.appendChild(info);
  content.appendChild(makeEventCommands(event.commands));
  return root;
}

function makeMapEvent(event: MapEvent, parentId: string): Node {
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
    content.appendChild(makePage(page, root.id, i));
  }

  return root;
}

function makePage(page: EventPage, parentId: string, index: number): Node {
  const root = document.createElement("div");
  root.id = parentId + `-p${index}`;
  root.classList.add("page");

  const details = createCollapsibleHeading({
    level: 3,
    name: `Page ${index}`,
    linkId: parentId,
  });

  if (page.condition) {
    const cond = page.condition;
    const container = document.createElement("div");
    container.classList.add("page-cond");

    if (page.condition.switch1) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        createSpanNode(`Switch ${cond.switch1}`, "switch"),
        document.createTextNode(" is "),
        createSpanNode("ON", "on"),
      );
      container.appendChild(div);
    }

    if (page.condition.switch2) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        createSpanNode(`Switch ${cond.switch2}`, "switch"),
        document.createTextNode(" is "),
        createSpanNode("ON", "on"),
      );
      container.appendChild(div);
    }

    if (page.condition.selfSwitch) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        createSpanNode(`Self Switch ${cond.selfSwitch}`, "selfswitch"),
        document.createTextNode(" is "),
        createSpanNode("ON", "on"),
      );
      container.appendChild(div);
    }

    if (page.condition.var) {
      const div = document.createElement("div");
      div.append(
        document.createTextNode("If "),
        createSpanNode(`Variable ${cond.var}`, "variable"),
        document.createTextNode(" >= "),
        createSpanNode(cond.value!.toString(), "value"),
      );
      container.appendChild(div);
    }

    details.appendChild(container);
  }

  details.appendChild(makeEventCommands(page.list));
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

function makeEventCommands(commands: EventCommand[]): Node {
  const root = document.createElement("div");
  root.classList.add("commands");

  const stack: Node[] = [root];
  for (const command of commands) {
    const newLevel = command.indent ?? 0;

    while (stack.length > newLevel + 1) {
      stack.pop();
    }

    const commandDiv = document.createElement("div");
    commandDiv.classList.add("command");
    const result = makeCommand(command);
    if (Array.isArray(result)) commandDiv.append(...result);
    else commandDiv.append(result);

    stack.at(-1)!.appendChild(commandDiv);
    stack.push(commandDiv);
  }

  return root;
}
