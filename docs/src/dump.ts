import { options } from "./options";
import { makeCommonEvents, makeMap } from "./tree";
import type { CommonEvents, MapDefinition } from "./types";
import { setCheckboxOn } from "./utils";

const urlParams = new URLSearchParams(window.location.search);
const game = urlParams.get("game")!;
const map = urlParams.get("map") ?? "common";

const root = document.getElementById("root")!;
const status = document.getElementById("status")!;

const miscDefs = await fetch(`data/${game}/misc.json`).then((res) =>
  res.json(),
);

function updateCheckboxes(): void {
  const dialogueOnlyCheckbox = document.getElementById("dialogue-check")!;
  const showInlineCheckbox = document.getElementById("inline-check")!;
  setCheckboxOn(dialogueOnlyCheckbox, options.getDialogueOnly());
  setCheckboxOn(showInlineCheckbox, options.getShowInline());
}

function updateShowInline(): void {
  document.querySelectorAll(".inline").forEach((e) => {
    (e as HTMLElement).style.display = options.getShowInline() ? "" : "none";
  });
}

function connectButtons(): void {
  document.getElementById("dialogue-toggle")!.onclick = () => {
    options.setDialogueOnly(!options.getDialogueOnly());
    updateCheckboxes();
    reload();
  };

  document.getElementById("inline-toggle")!.onclick = () => {
    options.setShowInline(!options.getShowInline());
    updateCheckboxes();
    updateShowInline();
  };

  document.getElementById("expand")!.onclick = () => {
    document.querySelectorAll("details").forEach((e) => (e.open = true));
  };

  document.getElementById("collapse")!.onclick = () => {
    document.querySelectorAll("details").forEach((e) => (e.open = false));
  };
}

async function reload(): Promise<void> {
  status.hidden = false;
  root.replaceChildren();

  const context = {
    misc: miscDefs,
    dialogueOnly: options.getDialogueOnly(),
  };

  if (map === "common") {
    const events: CommonEvents = await fetch(`data/${game}/common.json`).then(
      (res) => res.json(),
    );
    const tree = makeCommonEvents(events, context);
    root.appendChild(tree);
  } else {
    const files: string[] = [];
    if (map === "all") {
      const maps: Record<string, string> = await fetch(
        `data/${game}/maps.json`,
      ).then((res) => res.json());
      for (const id of Object.keys(maps))
        files.push(`data/${game}/map${id}.json`);
    } else {
      files.push(`data/${game}/map${map}.json`);
    }

    const promises: Promise<MapDefinition>[] = [];
    for (const file of files) {
      promises.push(fetch(file).then((res) => res.json()));
    }

    const loadedMaps = await Promise.all(promises);
    for (const map of loadedMaps) {
      const tree = makeMap(map, context);
      root.appendChild(tree);
    }
  }

  updateShowInline();
  status.hidden = true;
}

if (urlParams.has("dialogue")) options.setDialogueOnly(true);
connectButtons();
updateCheckboxes();
reload();
