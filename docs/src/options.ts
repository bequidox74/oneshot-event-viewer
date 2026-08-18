import { getBoolOption, setBoolOption } from "./utils";

const DIALOGUE_ONLY = "dialogue-only";
const SHOW_INLINE = "show-inline";

export const options = {
  getDialogueOnly: () => {
    return getBoolOption(DIALOGUE_ONLY);
  },

  setDialogueOnly: (on: boolean) => {
    setBoolOption(DIALOGUE_ONLY, on);
  },

  getShowInline: () => {
    return getBoolOption(SHOW_INLINE);
  },

  setShowInline: (on: boolean) => {
    setBoolOption(SHOW_INLINE, on);
  },
};
