#!/usr/bin/env python3
"""
Rebuild the 'Roci and I' WordPress blog from its print-to-PDF exports.

The PDFs are browser print-outs of the original fratian.com pages, so the
structure is regular enough to recover faithfully:

  29.0pt Poppins-Bold ... post title
  10.5pt Times ....... 'Posted by: gfratian | On: <date> | Uncategorized'
  12.4pt Times ....... body copy (Italic / Bold variants for emphasis)
   9.8pt Times ....... image captions
  15.8pt Poppins ..... 'N responses to "<title>"' -> comments start here
  12.3pt Times ....... comment text, x-indent encodes reply nesting
   8.0pt Times ....... per-page print header/footer  -> discarded
  18.0pt + Poppins-SemiBold ... site footer chrome   -> discarded

Outputs one HTML fragment with YAML front matter per chapter, plus the
de-duplicated images, ready for Jekyll.
"""

import argparse
import hashlib
import io
import json
import re
import unicodedata
from html import escape
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

# ---------------------------------------------------------------- constants

PAGE_H = 792.0
HEADER_Y = 30.0            # print timestamp band at the top of every page
FOOTER_Y = 760.0           # url + page-number band at the bottom

SZ_CHROME = 8.5            # <= this is print chrome
SZ_CAPTION = (9.0, 11.0)   # image captions
SZ_META = 10.5             # byline / comment dates
SZ_BODY = (11.5, 13.0)     # body copy and comment copy
SZ_RESPONSES = 15.8        # "N responses to ..."
SZ_TITLE = 29.0

FOOTER_TEXT = {
    "smart solutions for your business.",
    "company", "resources", "contact", "about", "home",
    "© 2024. all rights reserved.",
}

# Extra slack, in points, when deciding whether a line was soft-wrapped.
# Tuned against the corpus: the rate of paragraphs left ending mid-sentence
# bottoms out around 6pt, and larger values only start merging genuinely
# separate paragraphs together.
JOIN_SLACK = 6.0

MIN_IMAGE_PT = 60.0        # smaller than this on the page = gravatar/icon
MAX_IMAGE_W = 1600         # px, resize ceiling for the web
JPEG_QUALITY = 82

RE_BYLINE = re.compile(r"On:\s*(.+?)\s*\|")
RE_RESPONSES = re.compile(r"^(\d+|One|No)\s+response", re.I)
RE_POSTED_IN = re.compile(r"^Posted by\s+\S+\s+in\b", re.I)
RE_DATE = re.compile(
    r"^(January|February|March|April|May|June|July|August|September|October"
    r"|November|December)\s+\d{1,2},\s+\d{4}$"
)

# chapter order + canonical slug, taken from the original site URLs
CHAPTERS = [
    ("rociandi",                          "the Beginnings"),
    ("roci-and-i-starting-the-trip",      "starting the trip"),
    ("roci-and-i-oh-canada-quebec",       "Oh là là French Canada!"),
    ("roci-and-i-oh-canada",              "Oh, Canada!"),
    ("roci-and-i-oh-la-la-french-france", "Oh là là French France!"),
    ("back-in-canada",                    "Back in Canada"),
    ("roci-and-i-the-long-way-home",      "the long way home…"),
]
SLUG_ORDER = {s: i for i, (s, _) in enumerate(CHAPTERS)}


# ------------------------------------------------------------------ helpers

def clean(text):
    """Normalise the ligatures and odd spacing that PDF extraction leaves."""
    text = unicodedata.normalize("NFC", text)
    return text.replace(" ", " ").replace("ﬁ", "fi").replace("ﬂ", "fl")


def internalise(uri):
    """Rewrite old absolute fratian.com links to root-relative paths."""
    m = re.match(r"^https?://(?:www\.)?fratian\.com(/.*)?$", uri, re.I)
    if not m:
        return uri
    path = m.group(1) or "/"
    if re.match(r"^/(category|author|tag)/", path, re.I):
        return "/"          # taxonomy pages no longer exist
    return path


def rects_overlap(a, b, pad=1.0):
    return not (a[2] < b[0] - pad or a[0] > b[2] + pad or
                a[3] < b[1] - pad or a[1] > b[3] + pad)


def link_at(bbox, links):
    """Return the URI whose hot-zone covers the centre of this span."""
    cx, cy = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    for rect, uri in links:
        if rect[0] - 1 <= cx <= rect[2] + 1 and rect[1] - 1 <= cy <= rect[3] + 1:
            return uri
    return None


def is_chrome(text, size, font, bbox):
    if size <= SZ_CHROME:
        return True
    if bbox[3] < HEADER_Y or bbox[1] > FOOTER_Y:
        return True
    if font.startswith("Poppins-SemiBold") or abs(size - 18.0) < 0.3:
        return True
    if clean(text).strip().lower() in FOOTER_TEXT:
        return True
    return False


# --------------------------------------------------------------- extraction

def page_elements(page, doc):
    """Flatten one page into ordered text-line and image elements."""
    links = [(tuple(l["from"]), l["uri"]) for l in page.get_links() if l.get("uri")]

    # map each drawn image rect back to its xref so we can pull the bytes
    img_rects = []
    for info in page.get_images(full=True):
        xref = info[0]
        for r in page.get_image_rects(xref):
            img_rects.append((tuple(r), xref))

    els = []
    for block in page.get_text("dict")["blocks"]:
        bbox = block["bbox"]
        if block["type"] == 1:
            if bbox[3] < HEADER_Y or bbox[1] > FOOTER_Y:
                continue
            if (bbox[2] - bbox[0]) < MIN_IMAGE_PT or (bbox[3] - bbox[1]) < MIN_IMAGE_PT:
                continue                      # commenter avatar / site logo
            xref = next((x for r, x in img_rects if rects_overlap(r, bbox, 3)), None)
            if xref is None:
                continue
            els.append({"kind": "img", "y": bbox[1], "x": bbox[0],
                        "xref": xref, "bbox": bbox})
            continue

        for line in block["lines"]:
            spans = [s for s in line["spans"] if s["text"].strip()]
            if not spans:
                continue
            first = spans[0]
            raw = "".join(s["text"] for s in spans)
            if is_chrome(raw, first["size"], first["font"], line["bbox"]):
                continue
            els.append({
                "kind": "line",
                "y": line["bbox"][1], "x": line["bbox"][0], "x1": line["bbox"][2],
                "size": first["size"], "font": first["font"],
                "text": clean(raw), "spans": spans, "links": links,
            })

    els.sort(key=lambda e: (round(e["y"], 1), e["x"]))
    return els


def spans_to_html(spans, links):
    """Render spans, merging runs that share a link target or style."""
    out, buf, cur = [], "", None

    def style(s):
        f = s["font"]
        return ("Italic" in f, "Bold" in f and "Poppins" not in f,
                link_at(s["bbox"], links))

    def flush():
        nonlocal buf, cur
        if not buf:
            return
        italic, bold, uri = cur
        frag = escape(buf)
        if bold:
            frag = f"<strong>{frag}</strong>"
        if italic:
            frag = f"<em>{frag}</em>"
        if uri:
            ext = not uri.startswith("/")
            attrs = ' target="_blank" rel="noopener"' if ext else ""
            frag = f'<a href="{escape(uri)}"{attrs}>{frag}</a>'
        out.append(frag)
        buf = ""

    for s in spans:
        it, bo, uri = style(s)
        st = (it, bo, internalise(uri) if uri else None)
        if st != cur:
            flush()
            cur = st
        buf += clean(s["text"])
    flush()
    return "".join(out)


def group_lines(lines):
    """Merge soft-wrapped lines back into paragraphs.

    A line was soft-wrapped only if the next line's first word could not
    have fitted in the space left on it. Comparing against that word's
    width -- rather than a fixed right-margin slack -- keeps ragged
    paragraph endings intact while preserving the hard line breaks people
    typed into their comments.
    """
    if not lines:
        return []
    right = max(l["x1"] for l in lines)
    paras, cur = [], []
    for i, ln in enumerate(lines):
        cur.append(ln)
        soft = False
        if i + 1 < len(lines):
            nxt = lines[i + 1]
            char_w = (nxt["x1"] - nxt["x"]) / max(1, len(nxt["text"]))
            first_word = nxt["text"].split(" ")[0]
            soft = (right - ln["x1"]) < char_w * (len(first_word) + 1) + JOIN_SLACK
        if not soft:
            paras.append(cur)
            cur = []
    if cur:
        paras.append(cur)
    return paras


def render_paras(lines, links_fallback=None):
    html = []
    for para in group_lines(lines):
        spans, links = [], para[0]["links"]
        for i, ln in enumerate(para):
            if i:
                spans.append({"text": " ", "font": "Times-Roman",
                              "bbox": (-1, -1, -1, -1), "size": 12.4})
            spans.extend(ln["spans"])
        body = spans_to_html(spans, links).strip()
        if body:
            html.append(f"<p>{body}</p>")
    return html


# ---------------------------------------------------------------- image I/O

def save_image(doc, xref, outdir, seen):
    raw = doc.extract_image(xref)
    digest = hashlib.md5(raw["image"]).hexdigest()[:12]
    if digest in seen:
        return seen[digest]

    im = Image.open(io.BytesIO(raw["image"]))
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        im = im.convert("RGBA")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    elif im.mode != "RGB":
        im = im.convert("RGB")

    if im.width > MAX_IMAGE_W:
        h = round(im.height * MAX_IMAGE_W / im.width)
        im = im.resize((MAX_IMAGE_W, h), Image.LANCZOS)

    name = f"{digest}.jpg"
    outdir.mkdir(parents=True, exist_ok=True)
    im.save(outdir / name, "JPEG", quality=JPEG_QUALITY, optimize=True,
            progressive=True)
    seen[digest] = (name, im.width, im.height)
    return seen[digest]


# ------------------------------------------------------------ document pass

def parse_pdf(path, img_root, assets_url):
    doc = fitz.open(path)
    els = []
    for page in doc:
        els.extend(page_elements(page, doc))

    title = " ".join(e["text"] for e in els
                     if e["kind"] == "line" and abs(e["size"] - SZ_TITLE) < 0.5)
    title = re.sub(r"\s+", " ", title).strip()

    date = ""
    for e in els:
        if e["kind"] == "line" and abs(e.get("size", 0) - SZ_META) < 0.3:
            m = RE_BYLINE.search(e["text"])
            if m:
                date = m.group(1)
                break

    # locate section boundaries
    body_start = 0
    for i, e in enumerate(els):
        if e["kind"] == "line" and RE_BYLINE.search(e["text"]):
            body_start = i + 1
            break

    body_end = len(els)
    comments_start = None
    for i, e in enumerate(els[body_start:], body_start):
        if e["kind"] != "line":
            continue
        if comments_start is None and RE_RESPONSES.match(e["text"]) \
                and abs(e["size"] - SZ_RESPONSES) < 1.0:
            comments_start = i
            body_end = min(body_end, i)
        if RE_POSTED_IN.match(e["text"]) and abs(e["size"] - SZ_META) < 0.3:
            body_end = min(body_end, i)

    seen = {}
    # slug comes from the original page URL printed in the footer
    footer = doc[0].get_text()
    m = re.search(r"https://fratian\.com/([^/\s]+)/", footer)
    slug = m.group(1) if m else re.sub(r"\W+", "-", title.lower()).strip("-")

    outdir = img_root / slug
    body_html, pending, cover = [], [], None

    def flush_text():
        nonlocal pending
        if pending:
            body_html.extend(render_paras(pending))
            pending = []

    i = body_start
    while i < body_end:
        e = els[i]
        if e["kind"] == "img":
            flush_text()
            name, w, h = save_image(doc, e["xref"], outdir, seen)
            # a caption is the short small-type line directly beneath
            cap = ""
            j = i + 1
            while j < body_end and els[j]["kind"] == "line" and \
                    SZ_CAPTION[0] <= els[j]["size"] <= SZ_CAPTION[1]:
                cap += (" " if cap else "") + els[j]["text"]
                j += 1
            if cover is None:
                cover = f"{assets_url}/{slug}/{name}"
            fig = [f'<figure><img src="{assets_url}/{slug}/{name}" '
                   f'width="{w}" height="{h}" loading="lazy" alt="{escape(cap or title)}">']
            if cap:
                fig.append(f"<figcaption>{escape(cap)}</figcaption>")
            fig.append("</figure>")
            body_html.append("".join(fig))
            i = j
            continue
        if SZ_BODY[0] <= e["size"] <= SZ_BODY[1]:
            pending.append(e)
        elif SZ_CAPTION[0] <= e["size"] <= SZ_CAPTION[1]:
            flush_text()
            body_html.append(f'<p class="caption">{escape(e["text"])}</p>')
        i += 1
    flush_text()

    comments = parse_comments(els, comments_start, doc) if comments_start else []

    doc.close()
    return {
        "slug": slug, "title": title, "date": date, "cover": cover,
        "body": "\n".join(body_html), "comments": comments,
        "images": len(seen), "source": path.name,
    }


def parse_comments(els, start, doc):
    """Comments are author / date / text triples; x-indent encodes nesting."""
    items, cur, buf = [], None, []
    base_x = None

    def flush():
        nonlocal cur, buf
        if cur is not None:
            cur["html"] = "\n".join(render_paras(buf))
            items.append(cur)
        cur, buf = None, []

    i = start + 1
    while i < len(els):
        e = els[i]
        if e["kind"] != "line":
            i += 1
            continue
        # a date line closes the header; the line above it is the author,
        # which the previous comment will have swallowed as body text
        if abs(e["size"] - SZ_META) < 0.3 and RE_DATE.match(e["text"]):
            author_el = els[i - 1] if i and els[i - 1]["kind"] == "line" else None
            author = author_el["text"] if author_el else ""
            if buf and author_el is not None and buf[-1] is author_el:
                buf.pop()
            flush()
            if base_x is None:
                base_x = e["x"]
            cur = {"author": author, "date": e["text"],
                   "depth": max(0, min(3, round((e["x"] - base_x) / 24)))}
            i += 1
            continue
        if cur is not None and SZ_BODY[0] <= e["size"] <= SZ_BODY[1]:
            buf.append(e)
        i += 1
    flush()
    return items


# -------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf-dir", default="Roci and I travel blog")
    ap.add_argument("--out", default="site")
    ap.add_argument("--assets-url", default="/assets/roci")
    args = ap.parse_args()

    root = Path(__file__).resolve().parent.parent
    pdf_dir = root / args.pdf_dir
    site = root / args.out
    img_root = site / args.assets_url.strip("/")
    chapters_dir = site / "_chapters"
    chapters_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for pdf in sorted(pdf_dir.glob("*.pdf")):
        r = parse_pdf(pdf, img_root, args.assets_url)
        results.append(r)
        print(f"  {r['slug']:36} {r['title'][:34]:36} "
              f"imgs={r['images']:3} comments={len(r['comments']):3} "
              f"chars={len(r['body']):6}")

    results.sort(key=lambda r: SLUG_ORDER.get(r["slug"], 99))
    for n, r in enumerate(results, 1):
        r["number"] = n

    for n, r in enumerate(results):
        prev = results[n - 1] if n else None
        nxt = results[n + 1] if n + 1 < len(results) else None
        fm = {
            "title": r["title"],
            "chapter": r["number"],
            "date": r["date"],
            "permalink": f"/{r['slug']}/",
            "slug": r["slug"],
            "cover": r["cover"],
            "prev": f"/{prev['slug']}/" if prev else None,
            "prev_title": prev["title"] if prev else None,
            "next": f"/{nxt['slug']}/" if nxt else None,
            "next_title": nxt["title"] if nxt else None,
            "comments": r["comments"],
            "source_pdf": r["source"],
        }
        lines = ["---", "layout: chapter"]
        for k, v in fm.items():
            if v is None:
                continue
            if k == "comments":
                lines.append("comments:")
                for c in v:
                    lines.append(f"  - author: {json.dumps(c['author'])}")
                    lines.append(f"    date: {json.dumps(c['date'])}")
                    lines.append(f"    depth: {c['depth']}")
                    lines.append(f"    html: {json.dumps(c['html'])}")
            else:
                lines.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
        lines += ["---", "", r["body"], ""]
        out = chapters_dir / f"{r['number']:02d}-{r['slug']}.html"
        out.write_text("\n".join(lines), encoding="utf-8")

    print(f"\nwrote {len(results)} chapters -> {chapters_dir}")
    print(f"images -> {img_root}")


if __name__ == "__main__":
    main()
