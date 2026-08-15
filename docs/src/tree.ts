import { makeCommand } from "./commands";
import type { CommonEvent, CommonEvents, EventCommand, EventPage, MapDefinition, MapEvent } from "./types";

export function makeMap(map: MapDefinition, id: number): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("map");
    root.id = `map${id}`;

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

    const heading = document.createElement("h2");
    heading.textContent = `[${event.id}] ${event.name ?? "(unnamed)"}`;
    if (event.name == null) {
        heading.classList.add("unnamed");
    }

    const info = document.createElement("div");
    info.textContent = `x: ${event.x}, y: ${event.y}`;

    const pages = document.createElement("ul");
    pages.classList.add("pages");
    for (const [i, page] of event.pages.entries()) {
        pages.appendChild(makePage(page, i));
    }

    root.appendChild(heading);
    root.appendChild(info);
    root.appendChild(pages);
    return root;
}

export function makeCommonEvents(events: CommonEvents): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("events");
    root.id = "common-events";

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

function makeCommonEvent(_event: CommonEvent): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("event");
    return root;
}

function makePage(page: EventPage, index: number): HTMLElement {
    const root = document.createElement("li");
    root.classList.add("page");

    const heading = document.createElement("h3");
    heading.textContent = `Page ${index}`;
    root.appendChild(heading);

    if (page.condition) {
        const cond = page.condition;
        const condRoot = document.createElement("ul");
        condRoot.classList.add("page-condition", "border");

        if (cond.switch1) {
            const swch = document.createElement("li");
            swch.innerHTML = `If <span class="switch">Switch ${cond.switch1}</span> is <span class="on">ON</span>`;
            condRoot.appendChild(swch);
        }
        if (cond.switch2) {
            const swch = document.createElement("li");
            swch.innerHTML = `If <span class="switch">Switch ${cond.switch2}</span> is <span class="on">ON</span>`;
            condRoot.appendChild(swch);
        }
        if (cond.var) {
            const swch = document.createElement("li");
            swch.innerHTML = `If <span class="variable">Variable ${cond.var}</span> >= <span class="value">${cond.value}</span>`;
            condRoot.appendChild(swch);
        }
        if (cond.selfSwitch) {
            const swch = document.createElement("li");
            swch.innerHTML = `If <span class="selfswitch">Self Switch ${cond.selfSwitch}</span> is <span class="on">ON</span>`;
            condRoot.appendChild(swch);
        }

        root.appendChild(condRoot);
        root.appendChild(makeCommandTree(page.list ?? []));
    }

    return root;
}

function makeCommandTree(commands: EventCommand[]): HTMLElement {
    function createRoot(): HTMLElement {
        const root = document.createElement("ul");
        return root;
    }
    
    function wrapWithLi(elem: Node | Node[]): HTMLElement {
        const li = document.createElement("li");
        if (Array.isArray(elem)) li.append(...elem);
        else li.append(elem);
        return li;
    }

    const root = createRoot();
    root.classList.add("commands");
    const stack: HTMLElement[] = [];

    function peek(): HTMLElement {
        return stack.length > 0 ? stack[stack.length - 1] : root;
    }

    for (const command of commands) {
        const newLevel = command.indent ?? 0;
        const oldLevel = stack.length;

        if (newLevel <= oldLevel) stack.pop();
        else if (newLevel > oldLevel) {
            const newRoot = createRoot();
            const wrapped = newRoot;
            peek().appendChild(wrapped);
            stack.push(newRoot);
        }

        const wrapped = wrapWithLi(makeCommand(command));
        peek().appendChild(wrapped);
        stack.push(wrapped);
    }

    return root;
}
