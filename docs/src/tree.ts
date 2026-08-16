import type {
  CommonEvents,
  MapDefinition,
  MapEvent,
  CommonEvent,
} from "./types";

export function makeCommonEvents(events: CommonEvents): Node {
  const root = document.createElement("div");
  root.id = "common";
  
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  details.appendChild(summary);
  details.open = true;
  root.appendChild(details);
  
  const heading = document.createElement("h1");
  heading.textContent = "Common Events";
  summary.appendChild(heading);

  for (const event of events) {
    details.appendChild(makeEvent(event, root.id));
  }

  return root;
}

export function makeMap(map: MapDefinition): Node {
  const root = document.createElement("div");
  root.id = `map${map.id}`;

  for (const event of map.events) {
    root.appendChild(makeEvent(event, root.id));
  }

  return root;
}

function makeEvent(event: CommonEvent | MapEvent, parentId: string): Node {
  const root = document.createElement("div");
  root.id = `${parentId}-e${event.id}`;
  root.classList.add("event");
  return root;
}
