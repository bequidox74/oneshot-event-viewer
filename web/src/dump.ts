import { options } from "./options";
import { makeCommonEvents, makeMap, type Context } from "./tree";
import type { CommonEvents, MapDefinition } from "./types";
import { setCheckboxOn } from "./utils";

const NAME_PLACEHOLDERS: ReadonlyArray<string> = [
  "Player",
  "chat",
  "_PlayerName_xxxxxxxxxxxxxxxxxxxx",
];
const FUNNY_PLACEHOLDER_CHANCE = 0.5;

const urlParams = new URLSearchParams(window.location.search);
const game = urlParams.get("game")!;
const map = urlParams.get("map") ?? "common";

const root = document.getElementById("root")!;
const status = document.getElementById("status")!;

const miscDefs = await fetch(
  `data/${game == "wme" ? "os16" : game}/misc.json`,
).then((res) => res.json());

const dialogueOnlyCheckbox = document.getElementById("dialogue-check")!;
const showInlineCheckbox = document.getElementById("inline-check")!;
const nameInput = document.getElementById("playername")! as HTMLInputElement;

function updateNameInput(): void {
  if (Math.random() < FUNNY_PLACEHOLDER_CHANCE) {
    nameInput.placeholder =
      NAME_PLACEHOLDERS[
        1 + Math.floor(Math.random() * (NAME_PLACEHOLDERS.length - 1))
      ];
  } else {
    nameInput.placeholder = NAME_PLACEHOLDERS[0];
  }
}

function updateCheckboxes(): void {
  setCheckboxOn(dialogueOnlyCheckbox, options.dialogueOnly);
  setCheckboxOn(showInlineCheckbox, options.showInline);
}

function updateShowInline(): void {
  document.querySelectorAll(".inline").forEach((e) => {
    (e as HTMLElement).style.display = options.showInline ? "" : "none";
  });
}

function updatePlayerName(): void {
  if (nameInput.value) options.playerName = nameInput.value;
  document.querySelectorAll(".player").forEach((e) => {
    e.textContent = options.playerName;
  });
}

function connectButtons(): void {
  document.getElementById("dialogue-toggle")!.onclick = () => {
    options.dialogueOnly = !options.dialogueOnly;
    updateCheckboxes();
    reload();
  };

  document.getElementById("inline-toggle")!.onclick = () => {
    options.showInline = !options.showInline;
    updateCheckboxes();
    updateShowInline();
  };

  document.getElementById("expand")!.onclick = () => {
    document.querySelectorAll("details").forEach((e) => (e.open = true));
  };

  document.getElementById("collapse")!.onclick = () => {
    document.querySelectorAll("details").forEach((e) => (e.open = false));
  };

  nameInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      updatePlayerName();
    }
  });
  document.getElementById("playername-set")!.onclick = updatePlayerName;
}

async function reload(): Promise<void> {
  status.hidden = false;
  root.replaceChildren();

  const maps: Record<string, string> = await fetch(
    `data/${game}/maps.json`,
  ).then((res) => res.json());

  const context: Context = {
    misc: miscDefs,
    maps: maps,
    dialogueOnly: options.dialogueOnly,
    is2k3: game == "os14",
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
      context.map = map;
      const tree = makeMap(map, context);
      root.appendChild(tree);
    }
  }

  updateShowInline();
  updatePlayerName();
  status.hidden = true;
}

if (urlParams.has("dialogue")) options.dialogueOnly = true;
connectButtons();
updateCheckboxes();
updateNameInput();
reload();
