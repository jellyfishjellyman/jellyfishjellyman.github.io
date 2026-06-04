from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]

TEXT_EXTENSIONS = {
    ".bat",
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".py",
    ".toml",
    ".txt",
    ".yaml",
    ".yml",
}

SKIP_DIRS = {
    ".git",
    ".qa",
    ".tools",
    "public",
    "resources",
    "node_modules",
}

MOJIBAKE_MARKERS = (
    "\ufffd",
    "\u922b?",
    "\u8133",
    "\u951b",
    "\u9286",
    "\u934f",
    "\u9365",
    "\u6d93?",
    "\u8bf2?",
    "\u7ecb?",
    "\u9410?",
    "\u74a7",
    "\u5a13?",
)


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = set(rel.parts)
    if parts & SKIP_DIRS:
        return True
    if rel.parts[:2] == ("themes", "ananke"):
        return True
    return path.suffix.lower() not in TEXT_EXTENSIONS


def line_for_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def main() -> int:
    failures = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or should_skip(path):
            continue

        rel = path.relative_to(ROOT)
        try:
            data = path.read_bytes()
            text = data.decode("utf-8")
        except UnicodeDecodeError as exc:
            failures.append(f"{rel}: not valid UTF-8 at byte {exc.start}")
            continue

        for marker in MOJIBAKE_MARKERS:
            offset = text.find(marker)
            if offset != -1:
                line = line_for_offset(text, offset)
                failures.append(f"{rel}:{line}: suspicious mojibake marker {marker!r}")
                break

    if failures:
        print("Encoding check failed. These files may contain mojibake or non-UTF-8 text:")
        for item in failures:
            print(f"  - {item}")
        return 1

    print("Encoding check passed: UTF-8 text files and mojibake markers look clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
