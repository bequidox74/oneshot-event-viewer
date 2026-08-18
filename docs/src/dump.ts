import { makeCommonEvents, makeMap } from "./tree";
import type { CommonEvents, MapDefinition } from "./types";
import { getBoolOption, makeCheckbox, setBoolOption } from "./utils";

document.title = "Loading...";

const urlParams = new URLSearchParams(window.location.search);
const game = urlParams.get("game")!;
const map = urlParams.get("map") ?? "common";
const skip = urlParams.has("skip");

const root = document.getElementById("root")!;

const expandAll = document.getElementById("expand")!;
expandAll.onclick = () => {
  document.querySelectorAll("details").forEach((it) => (it.open = true));
};

const collapseAll = document.getElementById("collapse")!;
collapseAll.onclick = () => {
  document.querySelectorAll("details").forEach((it) => (it.open = false));
};

const dialogueToggle = document.getElementById("dialogue-toggle")!;
const dialogueCheck = document.getElementById("dialogue-check")!;

function updateDialogueOnly() {
  const newParams = new URLSearchParams(urlParams);
  if (skip) newParams.delete("skip");
  else newParams.append("skip", "");
  window.location.search = newParams.toString();
}
dialogueToggle.onclick = updateDialogueOnly;
dialogueCheck.textContent = makeCheckbox(urlParams.has("skip"));

const OPTION_SHOW_INLINE = "show-inline";
const inlineToggle = document.getElementById("inline-toggle")!;
const inlineCheck = document.getElementById("inline-check")!;
let showInline = getBoolOption(OPTION_SHOW_INLINE);

function updateHideInline(): void {
  setBoolOption(OPTION_SHOW_INLINE, showInline);
  document.querySelectorAll(".inline").forEach((e) => {
    (e as HTMLElement).style = showInline ? "" : "display: none";
  });
  inlineCheck.textContent = makeCheckbox(showInline);
}

inlineToggle.onclick = () => {
  showInline = !showInline;
  updateHideInline();
};
updateHideInline();

const miscDefs = await fetch(`data/${game}/misc.json`).then((res) =>
  res.json(),
);
const context = {
  misc: miscDefs,
  skip: skip,
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

document.getElementById("status")!.hidden = true;
document.title = "OneShot Event Viewer";
