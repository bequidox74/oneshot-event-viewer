import { getBoolOption, setBoolOption } from "./utils";

const DIALOGUE_ONLY = "dialogue-only";
const SHOW_INLINE = "show-inline";
const PLAYER_NAME = "playername";

export const DEFAULT_PLAYER_NAME = "Player";

export const options = {
  get dialogueOnly(): boolean {
    return getBoolOption(DIALOGUE_ONLY);
  },

  set dialogueOnly(on: boolean) {
    setBoolOption(DIALOGUE_ONLY, on);
  },

  get showInline(): boolean {
    return getBoolOption(SHOW_INLINE);
  },

  set showInline(on: boolean) {
    setBoolOption(SHOW_INLINE, on);
  },
  
  get playerName(): string {
    return sessionStorage.getItem(PLAYER_NAME) ?? DEFAULT_PLAYER_NAME;
  },

  set playerName(name: string) {
    sessionStorage.setItem(PLAYER_NAME, name);
  }
};
