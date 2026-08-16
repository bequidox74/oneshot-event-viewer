# ⚠️ WIP Notice!

A web frontend is currently in the works.

# OneShot Event Viewer

Allows browsing of RPG Maker events in *OneShot 2014*, *OneShot 2016*, *OneShot: World Machine Edition*, and *The Pancake Episode*.

# Preprocessing

1. Extract game data ([EasyRPG Tools](https://easyrpg.org/tools/) for OS14, [rpgtool](https://github.com/melody-rs/rpgtool) for OS16/PC, WME has the data in its game directory).
1. Run `oneshot_dlg.py` (works with Python 3.13, *maybe* lower), specifying the game engine (`-e xp`) and the path to the extracted input data. See usage for additional options.

# Hosted Data

The web frontend requires some files from the original games to function, namely:
- Glowing Clover item icon (used as favicon)
- Character portraits
- Default wallpaper from WME (used as background image)

The events, while derived from the original game files, are stripped down and cannot be used to recreate the original files. None of the original `.rxdata` files are hosted here.
