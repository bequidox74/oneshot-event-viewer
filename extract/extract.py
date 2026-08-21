import argparse
import logging
import pathlib

from extract_xp import do_xp, do_wme
from extract_2k3 import do_2k3
from utils import *

logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="OneShot Event Extractor",
        description="Extracts RPG Maker events from all OneShot games",
    )

    parser.add_argument(
        "-i",
        "--input",
        type=pathlib.Path,
        required=True,
        help="Input directory with extracted files (OS14/OS16/TPE) or 'gamedata' directory (WME)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=pathlib.Path,
        required=True,
        help="Output directory",
    )
    parser.add_argument(
        "-l",
        "--log-level",
        choices=["debug", "info", "warning", "error", "critical"],
        default="info",
        help="Logging level (debug/info/warning/error/critical)"
    )
    parser.add_argument(
        "-p",
        "--pretty",
        action="store_true",
        help="Use pretty JSON formatting for output (default is minify)",
    )
    parser.add_argument(
        "-d",
        "--dry-run",
        action="store_true",
        help="Dry run without writing any output to files",
    )
    parser.add_argument(
        "-s",
        "--scripts",
        action="store_true",
        help="Also extract Ruby scripts from XP games",
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "-e",
        "--engine",
        choices=["xp", "2k3", "wme"],
        help="Game engine ('2k3' for OS14, 'xp' for OS16/TPE, 'wme' for WME)",
    )
    group.add_argument(
        "-g",
        "--game",
        choices=["os14", "os16", "tpe", "wme"],
        help="Game: os14/os16/tpe/wme",
    )

    args = parser.parse_args()
    logging.basicConfig(level=args.log_level.upper())

    engine: str
    if args.engine:
        engine = args.engine
    else:
        match args.game:
            case "os14":
                engine = "2k3"
            case "os16" | "tpe":
                engine = "xp"
            case "wme":
                engine = "wme"
            case _:
                raise NotImplementedError

    match engine:
        case "2k3":
            do_2k3(args)
        case "xp":
            do_xp(args)
        case "wme":
            do_wme(args)


if __name__ == "__main__":
    main()
