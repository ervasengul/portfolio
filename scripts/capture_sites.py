#!/usr/bin/env python3
"""Screenshot the websites shown on the Designs page.

Run by .github/workflows/capture-sites.yml. For each site it saves, under
images/designs/<slug>/:
  desktop.webp     first screen at 1440x900
  mobile.webp      first screen at 390x844 (2x)
  section-N.webp   the next screens of the home page, top to bottom
  page-N.webp      first screen of up to three inner pages
  info.json        title, description, headings and links (used to write the copy)
"""
import io
import json
import os
import re
from urllib.parse import urljoin, urlparse

from PIL import Image
from playwright.sync_api import sync_playwright

# each site lists candidate URLs; the first one that loads is used
SITES = [
    ('burybella', ['https://burybella.com/']),
    ('itgirl-city-guides', ['https://www.itgirlcityguides.com/', 'https://itgirlcityguides.com/',
                            'https://www.itgirlcityguide.com/', 'https://itgirlcityguide.com/',
                            'http://itgirlcityguides.com/']),
    ('vendisyn', ['https://vendisyn.com/', 'https://www.vendisyn.com/']),
    ('yedik-app', ['https://yedik.app/']),
]
CTA = re.compile(r'shop now|shop|explore|discover|start|guides?|keşfet|alışveriş', re.I)
ROOT = os.path.join(os.path.dirname(__file__), '..', 'images', 'designs')

DISMISS = ['Accept', 'Accept all', 'Kabul et', 'Tümünü kabul et', 'Got it', 'OK', 'Close', 'Kapat']


def save_webp(png_bytes, path, width=None):
    im = Image.open(io.BytesIO(png_bytes)).convert('RGB')
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, 'WEBP', quality=82, method=6)
    return im.size


def settle(page):
    page.wait_for_timeout(3000)
    for label in DISMISS:
        try:
            btn = page.get_by_role('button', name=label, exact=True)
            if btn.count() and btn.first.is_visible():
                btn.first.click(timeout=1000)
                page.wait_for_timeout(400)
        except Exception:
            pass
    # scroll through the page so lazy images load, then back to the top
    page.evaluate("""async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
        window.scrollTo(0, 0);
    }""")
    page.wait_for_timeout(1200)


def main():
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for slug, candidates in SITES:
            out = os.path.join(ROOT, slug)
            os.makedirs(out, exist_ok=True)
            info = {'tried': []}
            try:
                ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
                page = ctx.new_page()
                url = None
                for cand in candidates:
                    try:
                        page.goto(cand, wait_until='load', timeout=45000)
                        url = cand
                        break
                    except Exception as e:
                        info['tried'].append([cand, str(e)[:160]])
                if url is None:
                    raise RuntimeError('no candidate URL loaded')
                info['url'] = url
                settle(page)
                info['final_url'] = page.url
                info['title'] = page.title()
                info['description'] = page.evaluate("() => (document.querySelector('meta[name=description]') || {}).content || ''")
                info['headings'] = page.evaluate("() => Array.from(document.querySelectorAll('h1,h2,h3')).map(h => h.innerText.trim()).filter(Boolean).slice(0, 40)")
                info['text'] = page.evaluate("() => document.body.innerText.slice(0, 4000)")
                links = page.evaluate("() => Array.from(document.querySelectorAll('a[href]')).map(a => [a.innerText.trim(), a.href])")
                host = urlparse(page.url).netloc
                inner = []
                for text, href in links:
                    u = urlparse(href)
                    if u.netloc == host and u.path not in ('', '/') and not re.search(r'\.(pdf|jpg|png|webp)$', u.path) and '#' not in href:
                        clean = urljoin(href, u.path)
                        if clean not in [h for _, h in inner]:
                            inner.append((text, clean))
                info['links'] = inner[:20]
                info['fonts'] = page.evaluate("() => [...new Set(Array.from(document.querySelectorAll('h1,h2,p,a')).slice(0, 60).map(e => getComputedStyle(e).fontFamily.split(',')[0]))]")

                info['desktop'] = save_webp(page.screenshot(), os.path.join(out, 'desktop.webp'))
                full = page.screenshot(full_page=True)
                im = Image.open(io.BytesIO(full))
                info['full_height'] = im.height
                n = 0
                for y in range(900, min(im.height, 900 * 6), 900):
                    crop = im.crop((0, y, 1440, min(im.height, y + 900)))
                    if crop.height < 300:
                        break
                    n += 1
                    buf = io.BytesIO(); crop.save(buf, 'PNG')
                    save_webp(buf.getvalue(), os.path.join(out, f'section-{n}.webp'))
                info['sections'] = n

                # follow the main call to action (e.g. SHOP NOW) when the home page has no inner links
                if not inner:
                    try:
                        cta = page.get_by_role('link', name=CTA).first
                        if not cta.count():
                            cta = page.get_by_role('button', name=CTA).first
                        cta.click(timeout=5000)
                        page.wait_for_load_state('load', timeout=45000)
                        settle(page)
                        info['cta_url'] = page.url
                        info['cta_title'] = page.title()
                        info['cta_text'] = page.evaluate("() => document.body.innerText.slice(0, 3000)")
                        save_webp(page.screenshot(), os.path.join(out, 'cta.webp'))
                        full = Image.open(io.BytesIO(page.screenshot(full_page=True)))
                        info['cta_full_height'] = full.height
                        k = 0
                        for y in range(900, min(full.height, 900 * 5), 900):
                            crop = full.crop((0, y, 1440, min(full.height, y + 900)))
                            if crop.height < 300:
                                break
                            k += 1
                            buf = io.BytesIO(); crop.save(buf, 'PNG')
                            save_webp(buf.getvalue(), os.path.join(out, f'cta-section-{k}.webp'))
                        host2 = urlparse(page.url).netloc
                        more = page.evaluate("() => Array.from(document.querySelectorAll('a[href]')).map(a => [a.innerText.trim(), a.href])")
                        for text, href in more:
                            u = urlparse(href)
                            if u.netloc == host2 and u.path not in ('', '/') and '#' not in href and href != page.url:
                                clean = urljoin(href, u.path)
                                if clean not in [h for _, h in inner]:
                                    inner.append((text, clean))
                        info['links'] = inner[:20]
                    except Exception as e:
                        info['cta_error'] = str(e)[:300]

                for i, (_, href) in enumerate(inner[:3], start=1):
                    try:
                        page.goto(href, wait_until='load', timeout=45000)
                        settle(page)
                        save_webp(page.screenshot(), os.path.join(out, f'page-{i}.webp'))
                        info.setdefault('pages', []).append([href, page.title()])
                    except Exception as e:  # keep going
                        info.setdefault('page_errors', []).append([href, str(e)[:200]])
                ctx.close()

                mctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
                mpage = mctx.new_page()
                mpage.goto(url, wait_until='load', timeout=60000)
                settle(mpage)
                info['mobile'] = save_webp(mpage.screenshot(), os.path.join(out, 'mobile.webp'), width=780)
                mctx.close()
            except Exception as e:
                info['error'] = str(e)[:500]
            with open(os.path.join(out, 'info.json'), 'w') as f:
                json.dump(info, f, ensure_ascii=False, indent=2)
            report[slug] = {k: info.get(k) for k in ('final_url', 'title', 'desktop', 'mobile', 'sections', 'error')}
        browser.close()
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
