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

  if (event.trigger !== undefined) {
    const span = document.createElement("div");
    span.append(
      document.createTextNode("Trigger: "),
      createSpanNode(event.trigger.toString(), "value"),
    );
    content.appendChild(span);
  }

  if (event.switchId !== undefined) {
    const sid = (event as CommonEvent).switchId;
    const span = document.createElement("div");
    span.append(
      createSpanNode(`Switch ${sid}`, "switch"),
      document.createTextNode(" is "),
      createSpanNode("ON", "on"),
    );
    content.appendChild(span);
  }

  content.appendChild(makeEventCommands(event.commands));
  return root;
}

function makeMapEvent(event: MapEvent, parentId: string): Node {
  const [root, content] = makeEventBase(event, parentId);

  const posSpan = document.createElement("div");
  posSpan.append(
    document.createTextNode("Position: ("),
    createSpanNode(event.x.toString(), "value"),
    document.createTextNode(","),
    createSpanNode(event.y.toString(), "value"),
    document.createTextNode(")"),
  );
  content.appendChild(posSpan);

  for (const [i, page] of event.pages.entries()) {
    content.appendChild(makePage(page, root.id, i));
  }

  return root;
}

function makePage(page: EventPage, parentId: string, index: number): Node {
  const root = document.createElement("div");
  root.id = parentId + `-p${index}`;
  const details = createCollapsibleHeading({
    level: 3,
    name: `Page ${index}`,
    linkId: parentId,
  });

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
  root.appendChild(document.createTextNode("not implemented"));
  return root;
}
