# [OneShot Event Viewer](https://bequidox74.github.io/oneshot-event-viewer/)

Allows browsing of RPG Maker events in *OneShot 2014*, *OneShot 2016*, *OneShot: World Machine Edition*, *The Pancake Episode*, and the *Frostide* mod.

## 🧪 Beta Notice 🐞

May contain bugs, missing features, and UI jank. Please report issues on the [issue tracker](https://github.com/bequidox74/oneshot-event-viewer/issues).

Mobile support is currently limited (it *works*, but the UI isn't optimized).

## Features

- Works completely in your browser (the server is only needed for serving files)
- Displays all non-empty RPG Maker events from all supported games
  - Descriptions for all commands (except `11610` / `KeyInputProcessing` from 2k3 because screw [that](https://github.com/EasyRPG/Player/blob/212f3466c9f276ff7cade5a5ead78d3a151343ac/src/game_interpreter.cpp#L3282))
  - Dialogue boxes with portraits and inline commands
  - Switch and variable names
  - Message box previews (including OS14)
- Search maps and common events for dialogue (regex and map filters supported)
- Set player name
- Hide non-dialogue events

> [!warning]
> Descriptions for RPG Maker 2003 commands are derived from [EasyRPG Player](https://github.com/EasyRPG/Player/tree/master), which may not be 100% behaviorally accurate to the original `RPG_RT` runtime that OS14 uses (though it should still be mostly correct, unless I made a mistake while untangling the spaghetti).

## Building

Use [npm](https://www.npmjs.com/) and [Vite](https://vite.dev/) to build the website from the `web/` directory. Don't forget to preprocess assets if you're adding games (see futher).

Run `npx vite` to test locally, `npm run build` to build and `npm run preview` to preview the built website.

## Preprocessing

1. Extract game data ([EasyRPG Tools](https://easyrpg.org/tools/) for OS14 and RPG Maker 2003 games, [rpgtool](https://github.com/melody-rs/rpgtool) for OS16/TPE and RPG Maker XP games; WME has the data in its game directory).
2. Run `extract.py` (Python 3.13+, standard library only), specifying the game engine (e.g. `-e xp`) and input and output paths. See usage for additional options.

## Hosted Data

The web frontend requires some files from the original games to function, namely:
- Glowing Clover item icon (used as favicon)
- Character portraits
- Default wallpaper from WME (used as background image)

The events, while derived from the original game files, are stripped down and cannot be used to recreate the original files. None of the original `.rxdata`/`.lmu` files are hosted here.
