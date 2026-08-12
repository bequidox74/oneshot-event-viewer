import { emitCommands as emitCommands } from "./commands.ts";
import type { MapDefinition, EventPage, PageCondition, EventCommand } from "./types.ts";

const root = document.getElementById("content")!;
const mapPath = "/dialogue/os16/map14.json";
const mapDef: MapDefinition = await fetch(mapPath).then(res => res.json());

for (const event of mapDef.events) {
    const eventRoot = document.createElement("div");
    eventRoot.classList.add("event");
    eventRoot.id = "ev" + event.id;

    let heading = document.createElement("h2");
    let name = event.name ? event.name : "(unnamed)";
    name += ` (${event.id})`;
    heading.innerText = name;
    eventRoot.appendChild(heading);

    for (const [i, page] of event.pages.entries()) {
        eventRoot.appendChild(emitPage(page, i));
    }

    root.appendChild(eventRoot);
}

function emitPage(page: EventPage, index: number): HTMLElement {
    const pageRoot = document.createElement("div");
    pageRoot.innerText = "Page " + index;
    pageRoot.classList.add("page");

    if (page.condition) {
        pageRoot.appendChild(emitPageCondition(page.condition));
    }

    const commands = emitCommands(page.list);
    pageRoot.appendChild(commands);

    return pageRoot;
}

function emitSwitch(index: number): HTMLElement {
    const switchRoot = document.createElement("div");
    switchRoot.innerHTML = `If <span class="variable">Switch</span> ${index} is <span class="on">ON</span>`;
    return switchRoot;
}

function emitPageCondition(conds: PageCondition): HTMLElement {
    const myRoot = document.createElement("div");
    myRoot.classList.add("page-conditions");

    if (conds.switch1) {
        myRoot.appendChild(emitSwitch(conds.switch1));
    }

    if (conds.switch2) {
        myRoot.appendChild(emitSwitch(conds.switch2));
    }

    if (conds.var) {
        const v = document.createElement("div");
        v.innerHTML = `If <span class="variable">Variable ${conds.var}</span> is >= ${conds.value}`;
        myRoot.appendChild(v);
    }

    if (conds.selfSwitch) {
        const ss = document.createElement("div");
        ss.innerHTML = `If <span class="variable">SelfSwitch</span> ${conds.selfSwitch} is <span class="on">ON</span>`;
        myRoot.appendChild(ss);
    }

    return myRoot;
}
