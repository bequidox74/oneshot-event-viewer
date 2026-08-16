import type {
  CommonEvents,
  MapDefinition,
  MapEvent,
  CommonEvent,
} from "./types";
import { makeCollapsibleHeading } from "./utils";

export function makeCommonEvents(events: CommonEvents): Node {
  const root = document.createElement("div");
  root.id = "common";

  const details = makeCollapsibleHeading({
    level: 1,
    name: "Common Events",
  });
  root.appendChild(details);

  for (const event of events) {
    details.appendChild(makeEvent(event, root.id));
  }

  return root;
}

export function makeMap(map: MapDefinition): Node {
  const root = document.createElement("div");
  root.id = `map${map.id}`;

  const details = makeCollapsibleHeading({
    level: 1,
    name: map.name,
    id: map.id,
  });
  root.appendChild(details);

  for (const event of map.events) {
    details.appendChild(makeEvent(event, root.id));
  }

  return root;
}

function makeEvent(event: CommonEvent | MapEvent, parentId: string): Node {
  const root = document.createElement("div");
  root.id = `${parentId}-e${event.id}`;
  root.classList.add("event");

  const details = makeCollapsibleHeading({
    level: 2,
    name: event.name,
    id: event.id,
    linkId: parentId,
  });
  root.appendChild(details);

  return root;
}
