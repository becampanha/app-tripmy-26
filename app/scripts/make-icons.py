#!/usr/bin/env python3
"""Generates placeholder PWA icons (solid dark square + a simple circle glyph)
without any imaging library, so it runs anywhere Python 3 does."""
import struct
import zlib
import os

BG = (0x1c, 0x1a, 0x17)
FG = (0xf7, 0xf5, 0xf1)

def make_png(path, size):
    cx = cy = size / 2
    r = size * 0.28
    rows = []
    for y in range(size):
        row = bytearray([0])  # filter type 0 (none)
        for x in range(size):
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy <= r * r:
                row.extend(FG)
            else:
                row.extend(BG)
        rows.append(bytes(row))
    raw = b"".join(rows)
    compressed = zlib.compress(raw, 9)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
    os.makedirs(out_dir, exist_ok=True)
    make_png(os.path.join(out_dir, "icon-192.png"), 192)
    make_png(os.path.join(out_dir, "icon-512.png"), 512)
    print("icons written to", out_dir)
