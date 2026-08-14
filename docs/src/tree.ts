import type { CommonEvent, CommonEvents, MapDefinition, MapEvent } from "./types";

export function makeMap(map: MapDefinition): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("map");
    
    const heading = document.createElement("h1");
    const mapName = map.name ? map.name : "(unnamed)";
    if (!map.name) heading.classList.add("unnamed");
    heading.textContent = `${mapName} (${map.id})`;
    
    const eventList = document.createElement("ul");
    eventList.classList.add("events");
    for (const event of map.events) {
        eventList.appendChild(makeMapEvent(event));
    }
    
    root.appendChild(heading);
    root.appendChild(eventList);
    return root;
}

function makeMapEvent(event: MapEvent): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("event");
    return root;
}

export function makeCommonEvents(events: CommonEvents): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("events");
    
    const heading = document.createElement("h1");
    heading.textContent = "Common Events";
    
    const eventList = document.createElement("ul");
    eventList.classList.add("events");
    for (const event of events) {
        eventList.appendChild(makeCommonEvent(event));
    }
    
    root.appendChild(heading);
    root.appendChild(eventList);
    return root;
}

function makeCommonEvent(event: CommonEvent): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("event");
    return root;
}
