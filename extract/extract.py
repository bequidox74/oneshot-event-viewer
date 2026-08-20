import argparse
import logging

from extract_xp import do_xp, do_wme
from extract_2k3 import do_2k3
from utils import *

logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("directory")
    parser.add_argument("-e", "--engine", choices=["2k3", "xp", "wme"], required=True)
    parser.add_argument(
        "-l",
        "--log-level",
        choices=["debug", "info", "warning", "error", "critical"],
        default="info",
    )
    parser.add_argument("-o", "--output", default="./out")
    parser.add_argument("-p", "--pretty", action="store_true")
    parser.add_argument("-d", "--dry-run", action="store_true")

    args = parser.parse_args()
    logging.basicConfig(level=args.log_level.upper())

    match args.engine.lower():
        case "2k3":
            do_2k3(args)
        case "xp":
            do_xp(args)
        case "wme":
            do_wme(args)


if __name__ == "__main__":
    main()
