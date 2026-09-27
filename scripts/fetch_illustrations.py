#!/usr/bin/env python3
"""Download the generated illustrations and store them as optimised WebP files.

Run by .github/workflows/fetch-assets.yml (the source CDN is not reachable from
every environment). Each entry: (source url, output name, target width).
"""
import io
import os
import urllib.request

from PIL import Image

CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3Ih5RksuIE9koNwGBrvsdqW8kld/"
OUT = os.path.join(os.path.dirname(__file__), "..", "images", "illustrations")

ASSETS = [
    # hero: 4k upscale of the top-down "coding at the desk" scene
    ("hf_20260927_170911_d4ba18ab-a6e7-44df-8c2a-6b9cf24b9eaf.png", "hero-2048.webp", 2048),
    ("hf_20260927_170911_d4ba18ab-a6e7-44df-8c2a-6b9cf24b9eaf.png", "hero-1200.webp", 1200),
    # project covers (1024 x 688 originals)
    ("hf_20260927_170829_c9f757b2-0988-4029-931f-bbcc26692ade.png", "cluster.webp", 1024),
    ("hf_20260927_170829_ba845331-0f76-424c-ad62-3f6c76c24a29.png", "yedik.webp", 1024),
    ("hf_20260927_170829_b06b158e-b241-4f2d-ac2e-9f2ffdf8979c.png", "medical.webp", 1024),
    ("hf_20260927_170828_d4359e0c-5857-4491-b3e6-a6b8b3a53b1b.png", "emotion.webp", 1024),
    ("hf_20260927_170829_805d2a5c-2f8a-492c-a81f-ba07b9c6201f.png", "weather.webp", 1024),
    ("hf_20260927_170831_ba127b44-836e-4415-8f19-bda57fdcff54.png", "battery.webp", 1024),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    for name, out, width in ASSETS:
        if name not in cache:
            with urllib.request.urlopen(CDN + name, timeout=60) as r:
                cache[name] = r.read()
        im = Image.open(io.BytesIO(cache[name])).convert("RGB")
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        path = os.path.join(OUT, out)
        im.save(path, "WEBP", quality=82, method=6)
        corner = "#%02x%02x%02x" % im.getpixel((6, 6))
        print(f"{out}: {im.width}x{im.height} {os.path.getsize(path)} bytes bg={corner}")


if __name__ == "__main__":
    main()
