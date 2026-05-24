"""Build side-by-side city lens contact sheets against repo reference images."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ASPECTS = [
    "transport-speed",
    "transport-access",
    "transport-reliability",
    "planning-pressure",
    "planning-delta",
    "planning-parcels",
    "civic-access-gaps",
    "civic-catchment",
    "civic-demand",
    "economy-vitality",
    "economy-land-use",
    "economy-gravity",
    "utilities-capacity",
    "utilities-resilience",
    "utilities-works",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference-dir", default="tmp/reference-screens")
    parser.add_argument("--audit-dir", required=True)
    parser.add_argument("--cities", default="belfast,london,nyc")
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--out", required=True)
    parser.add_argument("--thumb-width", type=int, default=360)
    parser.add_argument(
        "--crop",
        choices=["map", "full"],
        default="map",
        help="Use map to compare the map canvas only; full keeps surrounding product chrome.",
    )
    return parser.parse_args()


def load_font(size: int) -> ImageFont.ImageFont:
    for name in ("arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def crop_map_canvas(image: Image.Image) -> Image.Image:
    width, height = image.size
    # Reference screenshots use a stable desktop shell: header, left rail, right drawer,
    # and timeline frame the map. These fractions isolate the map canvas itself.
    box = (
        round(width * 0.147),
        round(height * 0.058),
        round(width * 0.798),
        round(height * 0.775),
    )
    return image.crop(box)


def fit_image(path: Path | None, size: tuple[int, int], label: str, crop: str) -> Image.Image:
    width, height = size
    if path and path.exists():
        with Image.open(path) as image:
            image = image.convert("RGB")
            if crop == "map":
                image = crop_map_canvas(image)
            image.thumbnail(size, Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", size, "white")
            x = (width - image.width) // 2
            y = (height - image.height) // 2
            canvas.paste(image, (x, y))
            return canvas
    canvas = Image.new("RGB", size, "#f4f1eb")
    draw = ImageDraw.Draw(canvas)
    font = load_font(18)
    text = f"Missing\n{label}"
    bbox = draw.multiline_textbbox((0, 0), text, font=font, align="center")
    draw.multiline_text(
        ((width - (bbox[2] - bbox[0])) / 2, (height - (bbox[3] - bbox[1])) / 2),
        text,
        fill="#8a3f32",
        font=font,
        align="center",
    )
    return canvas


def screenshot_path(audit_dir: Path, city: str, aspect: str, year: int) -> Path:
    return audit_dir / city / "screenshots" / f"{aspect}-{year}.png"


def main() -> None:
    args = parse_args()
    reference_dir = Path(args.reference_dir)
    audit_dir = Path(args.audit_dir)
    cities = [item.strip() for item in args.cities.split(",") if item.strip()]
    columns = ["reference", *cities]
    thumb_w = args.thumb_width
    thumb_h = round(thumb_w * 9 / 16)
    gutter = 12
    header_h = 34
    row_label_w = 190
    sheet_w = row_label_w + len(columns) * (thumb_w + gutter) + gutter
    sheet_h = header_h + len(ASPECTS) * (thumb_h + header_h + gutter) + gutter

    sheet = Image.new("RGB", (sheet_w, sheet_h), "white")
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(18)
    label_font = load_font(14)
    small_font = load_font(12)

    draw.text((gutter, 7), f"Reference parity contact sheet - {args.year}", fill="#1e2b2f", font=title_font)
    for col, name in enumerate(columns):
        x = row_label_w + gutter + col * (thumb_w + gutter)
        draw.text((x, 10), name, fill="#1e2b2f", font=label_font)

    y = header_h + gutter
    for aspect in ASPECTS:
        draw.text((gutter, y + 6), aspect, fill="#1e2b2f", font=label_font)
        draw.text((gutter, y + 25), "source-backed lens render", fill="#5c686b", font=small_font)
        image_paths: list[Path | None] = [reference_dir / f"{aspect}.jpg"]
        image_paths.extend(screenshot_path(audit_dir, city, aspect, args.year) for city in cities)
        for col, image_path in enumerate(image_paths):
            x = row_label_w + gutter + col * (thumb_w + gutter)
            tile = fit_image(image_path, (thumb_w, thumb_h), f"{columns[col]} {aspect}", args.crop)
            sheet.paste(tile, (x, y))
            draw.rectangle((x, y, x + thumb_w, y + thumb_h), outline="#d7dad8", width=1)
        y += thumb_h + header_h + gutter

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=92)
    print(f"Wrote reference contact sheet: {out_path}")


if __name__ == "__main__":
    main()
