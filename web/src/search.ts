import type { CommonEvents, EventCommand, MapDefinition } from "./types";
import { createHeading, createSpoiler, setCheckboxOn } from "./utils";

// ===== DOM Elements =====
const query = document.getElementById("query")! as HTMLInputElement;
const caseToggle = document.getElementById("case-toggle")!;
const caseCheckbox = document.getElementById("case-check")!;
const runButton = document.getElementById("search")!;
const runRegexButton = document.getElementById("search-regex")!;
const expandButton = document.getElementById("expand")!;
const collapseButton = document.getElementById("collapse")!;
const clearButton = document.getElementById("clear")!;
const clearFilterButton = document.getElementById("clear-filter")!;
const mapFilter = document.getElementById("map-filter")! as HTMLInputElement;

const title = document.getElementById("title")!;
const loading = document.getElementById("loading")!;
const resultsCount = document.getElementById("count")!;
const resultsContainer = document.getElementById("results-container")!;
const resultsRoot = document.getElementById("results")!;

// ===== Constants =====
// if there's *that* many, the search is probably useless anyway.
const SEARCH_LIMIT = 500;
const ALLOWED_COMMANDS = new Set([101, 355, 10110]);
const TITLE = "Search in Dialogue";
const GAME_NAME: Record<string, string> = {
  os14: "OS14",
  os16: "OS16",
  pc: "TPE",
  wme: "WME",
  frostide: "Frostide",
};

// ===== State =====
let game: string = "";
let ignoreCase: boolean = true;
let mapNames: Map<string, string> = new Map();
let hitCount = 0;

// ===== Main =====
main();

async function main(): Promise<void> {
  connectEvents();
  setCheckboxOn(caseCheckbox, ignoreCase);

  // load maps
  const urlParams = new URLSearchParams(window.location.search);
  game = urlParams.get("game") ?? "";
  mapNames = await fetch(`data/${game}/maps.json`).then((res) => res.json());

  title.textContent = `${TITLE} (${GAME_NAME[game]})`;
}

function connectEvents(): void {
  runButton.onclick = () => {
    runSearch("text");
  };

  runRegexButton.onclick = () => {
    runSearch("regex");
  };

  query.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      runSearch("text");
      query.blur();
    }
  });

  clearButton.onclick = () => {
    query.value = "";
  };
  clearFilterButton.onclick = () => {
    mapFilter.value = "";
  };

  caseToggle.onclick = () => {
    ignoreCase = !ignoreCase;
    setCheckboxOn(caseCheckbox, ignoreCase);
  };

  expandButton.onclick = () => {
    document.querySelectorAll("details").forEach((e) => (e.open = true));
  };

  collapseButton.onclick = () => {
    document.querySelectorAll("details").forEach((e) => (e.open = false));
  };
}

async function runSearch(mode: "text" | "regex"): Promise<void> {
  let needle = query.value;
  if (!needle) return;
  if (ignoreCase && mode !== "regex") needle = needle.toLowerCase();

  loading.hidden = false;
  resultsContainer.hidden = true;
  resultsCount.hidden = true;
  resultsRoot.replaceChildren();

  const filters = parseFilter(mapFilter.value);
  if (filters.size == 0 && !mapFilter.value) {
    // only add stuff if there's no text in the filter
    filters.add("common");
    for (const id in mapNames) {
      filters.add(`map${id}`);
    }
  }

  let common: CommonEvents | null = null;
  if (filters.has("common")) {
    common = await fetch(`data/${game}/common.json`).then((res) => res.json());
  }

  const mapPromises: Promise<MapDefinition>[] = [];
  for (const file of filters) {
    if (file === "common") continue;
    mapPromises.push(
      fetch(`data/${game}/${file}.json`).then((res) => res.json()),
    );
  }
  const maps = await Promise.all(mapPromises);

  hitCount = 0;
  let overLimit = false;

  function iterateCommands(
    commands: EventCommand[] | undefined,
    parent: HTMLElement,
  ): boolean {
    if (!commands) return true;
    for (const command of commands) {
      const hit = matches(command, needle, mode);
      if (!hit) continue;

      hitCount++;
      if (hitCount >= SEARCH_LIMIT) {
        overLimit = true;
        return false;
      }

      const li = document.createElement("li");
      li.textContent = hit;
      parent.appendChild(li);
    }
    return true;
  }

  if (common) {
    const details = createSpoiler("Common Events");
    details.open = true;
    let hasChildren = false;
    outer: for (const event of common) {
      const link = document.createElement("a");
      link.href = `dump?game=${game}#common-e${event.id}`;
      link.textContent = "(link)";

      const eventDetails = createSpoiler(
        createHeading(event.name, event.id),
        link,
      );
      const list = document.createElement("ul");
      eventDetails.appendChild(list);

      if (!iterateCommands(event.commands, list)) break outer;

      if (list.hasChildNodes()) {
        details.appendChild(eventDetails);
        hasChildren = true;
      }
    }
    if (hasChildren) resultsRoot.appendChild(details);
  }

  outer: for (const map of maps) {
    const mapDetails = createSpoiler(createHeading(map.name, map.id));
    mapDetails.open = true;
    let mapHasChildren = false;
    for (const event of map.events) {
      let eventHasChildren = false;
      const eventDetails = createSpoiler(createHeading(event.name, event.id));

      for (const [i, page] of event.pages.entries()) {
        const pageLink = document.createElement("a");
        pageLink.textContent = "(link)";
        pageLink.href = `dump?game=${game}&map=${map.id}#map${map.id}-e${event.id}-p${i}`;

        const pageDetails = createSpoiler(`Page ${i} `, pageLink);
        pageDetails.open = true;
        const list = document.createElement("ul");
        if (!iterateCommands(page.list, list)) break outer;

        if (list.hasChildNodes()) {
          pageDetails.appendChild(list);
          eventDetails.appendChild(pageDetails);
          eventHasChildren = true;
        }
      }

      if (eventHasChildren) {
        mapDetails.appendChild(eventDetails);
        mapHasChildren = true;
      }
    }

    if (mapHasChildren) resultsRoot.appendChild(mapDetails);
  }

  if (hitCount == 0) resultsCount.textContent = "No results.";
  else resultsCount.textContent = `Results: ${hitCount}`;
  if (overLimit) resultsCount.textContent += "+";
  resultsCount.hidden = false;

  loading.hidden = true;
  resultsContainer.hidden = false;
}

function parseFilter(filter: string): Set<string> {
  const result: Set<string> = new Set();
  filter = filter.trim();
  if (!filter) return result;

  const parts = filter.split(",");
  for (let part of parts) {
    part = part.trim();
    if (!part) continue; // skip empties
    if (part === "common") {
      result.add("common");
      continue;
    }

    const match = part.match(/(\d+)(?:-(\d+))?/);
    if (!match) continue;
    const from = parseInt(match[1]);
    const to = match[2] ? parseInt(match[2]) : from;
    for (let i = from; i <= to; i++) {
      result.add(`map${i}`);
    }
  }

  return result;
}

function matches(
  command: EventCommand,
  needle: string,
  mode: "text" | "regex",
): string | null {
  if (!ALLOWED_COMMANDS.has(command.code)) return null;
  const original = command.params[0] as string;
  let text = original;
  if (ignoreCase) text = text.toLowerCase();

  let hit = false;
  switch (mode) {
    case "text":
      hit = text.includes(needle);
      break;
    case "regex":
      hit = text.match(needle) !== null;
      break;
  }
  return hit ? original : null;
}
