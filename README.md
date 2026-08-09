# ⚠️ WIP Notice!

TODO:
- [x] Parse events from OS16
- [ ] Make WME parsing work
- [ ] Convert OS14's XML to JSON
- [ ] Add a frontend to display everything
- [ ] Document the preprocessor

# OneShot Event Viewer

Allows browsing of events in *OneShot 2014*, *OneShot 2016*, and *OneShot: World Machine Edition*.

# Preprocessing

1. Extract game data ([liblcf](https://github.com/EasyRPG/liblcf) for OS14, [rpgtool](https://github.com/melody-rs/rpgtool) for OS16, WME has the data in its game directory).
1. Run `oneshot_dlg.py` (works with Python 3.13, *maybe* lower), specifying the game edition (`-g os14`) and the path to the extracted data. See usage for additional options.
