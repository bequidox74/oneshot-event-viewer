import { getBoolOption, setBoolOption } from "./utils";

//===== Definitions =====//

const DIALOGUE_ONLY = "skip";
const SHOW_INLINE = "show-inline";

let dialogueOnly = getBoolOption(DIALOGUE_ONLY);
let showInline = getBoolOption(SHOW_INLINE, true);

export function getDialogueOnly(): boolean {
  return dialogueOnly;
}

export function getShowInline(): boolean {
  return showInline;
}

//===== Checkboxes =====//

// const dialogueOnlyCheckbox = document.getElementById("dialogue-check")!;
const showInlineCheckbox = document.getElementById("inline-check")!;

//===== Toggles =====//

const dialogueOnlyToggle = document.getElementById("dialogue-toggle")!;
dialogueOnlyToggle.onclick = () => {
  dialogueOnly = !dialogueOnly;
  updateDialogueOnly();
};

const showInlineToggle = document.getElementById("inline-toggle")!;
showInlineToggle.onclick = () => {
  showInline = !showInline;
  updateShowInline();
};

//===== Updates =====//

function updateDialogueOnly(): void {}

function updateShowInline(): void {
  setBoolOption(SHOW_INLINE, showInline);
  document.querySelectorAll(".inline").forEach((e) => {
    (e as HTMLElement).style.display = showInline ? "" : "none";
  });

  if (showInline) showInlineCheckbox.classList.add("on");
  else showInlineCheckbox.classList.remove("on");
}

//===== Main =====//

updateDialogueOnly();
updateShowInline();
