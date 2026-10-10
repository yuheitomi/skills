#!/usr/bin/env python3
"""Copy selected local files and consistent SQLite snapshots into a worktree."""
import argparse
import os
from pathlib import Path
import shutil
import sqlite3
import sys
import tempfile


def local_path(root, relative):
    path = Path(relative)
    if path.is_absolute() or not path.parts or any(p in ("..", ".git") for p in path.parts):
        raise ValueError(f"Expected a repository-relative file path: {relative}")
    current = root
    for part in path.parts:
        current = current / part
        if current.is_symlink():
            raise ValueError(f"Symlink paths are not supported: {relative}")
    if not current.resolve().is_relative_to(root):
        raise ValueError(f"Path escapes its root: {relative}")
    return current


def publish(source, destination, snapshot):
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Temporary files are private and on the destination filesystem. Hard-link
    # publication is atomic and fails if another setup already created the file.
    fd, temporary = tempfile.mkstemp(prefix=".worktree-setup-", dir=destination.parent)
    os.close(fd)
    temporary = Path(temporary)
    try:
        if snapshot:
            reader = sqlite3.connect(source.as_uri() + "?mode=ro", uri=True, timeout=10)
            writer = None
            try:
                reader.execute("PRAGMA query_only = ON")
                writer = sqlite3.connect(temporary)
                reader.backup(writer)
                if writer.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
                    raise ValueError("SQLite snapshot integrity check failed")
            finally:
                if writer is not None:
                    writer.close()
                reader.close()
        else:
            shutil.copyfile(source, temporary)
        temporary.chmod(0o600)
        try:
            os.link(temporary, destination)
        except FileExistsError:
            print(f"Preserved existing: {destination.name}")
            return False
        return True
    finally:
        temporary.unlink(missing_ok=True)
        for suffix in ("-wal", "-shm", "-journal"):
            Path(str(temporary) + suffix).unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--destination", required=True, type=Path)
    parser.add_argument("--env", action="append", default=[], metavar="RELATIVE_PATH")
    parser.add_argument("--sqlite", action="append", default=[], metavar="RELATIVE_PATH")
    parser.add_argument("--optional-file", action="append", default=[], metavar="RELATIVE_PATH")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        source_root = args.source.resolve(strict=True)
        destination_root = args.destination.resolve(strict=True)
        if not source_root.is_dir() or not destination_root.is_dir():
            raise ValueError("Source and destination must be existing directories")
        if source_root == destination_root or source_root.is_relative_to(destination_root):
            raise ValueError("Destination must not equal or contain the source checkout")
        selections = [(p, False, False) for p in args.env]
        selections += [(p, True, False) for p in args.sqlite]
        selections += [(p, False, True) for p in args.optional_file]
        if not selections:
            raise ValueError("Select at least one --env, --sqlite, or --optional-file")
        operations = []
        seen = set()
        # Preflight all paths before performing any copies.
        for relative, snapshot, optional in selections:
            source = local_path(source_root, relative)
            destination = local_path(destination_root, relative)
            if destination in seen:
                raise ValueError(f"Duplicate destination: {relative}")
            seen.add(destination)
            if destination.exists():
                if not destination.is_file():
                    raise ValueError(f"Destination is not a regular file: {relative}")
                print(f"Preserved existing: {relative}")
                continue
            if not source.exists():
                if optional:
                    print(f"Skipped missing optional file: {relative}")
                    continue
                raise ValueError(f"Missing required file: {relative}")
            if not source.is_file():
                raise ValueError(f"Source is not a regular file: {relative}")
            operations.append((relative, source, destination, snapshot))
        for relative, source, destination, snapshot in operations:
            action = "Snapshot SQLite" if snapshot else "Copy"
            if args.dry_run:
                print(f"Would {action.lower()}: {relative}")
            elif publish(source, destination, snapshot):
                print(f"{action}: {relative}")
        return 0
    except (OSError, ValueError, sqlite3.Error) as error:
        # Do not include data or env contents in error messages.
        print(f"Worktree setup failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
