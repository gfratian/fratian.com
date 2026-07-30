# fratian.com

The source for [fratian.com](https://fratian.com). It's a static site: GitHub
stores these files, builds them into web pages automatically, and serves them
for free. There is nothing to pay and nothing to renew.

## Adding a new travel chapter

You can do all of this in the browser — no software to install.

1. Open the `_chapters` folder above.
2. **Add file → Create new file**.
3. Name it something like `08-iceland.html`.
4. Paste this at the top, edit the values, then write below it:

```
---
layout: chapter
title: "Roci and I – Iceland"
chapter: 8
date: "2025-06-14"
permalink: /roci-and-i-iceland/
prev: /roci-and-i-the-long-way-home/
prev_title: "Roci and I – the long way home…"
---

<p>First paragraph goes here.</p>
<figure>
  <img src="/assets/roci/iceland/photo1.jpg" alt="">
  <figcaption>A caption.</figcaption>
</figure>
```

5. Click **Commit changes**.

The chapter appears at fratian.com within about a minute, and the list on
`/travel/` updates itself. Remember to add `next:` and `next_title:` to the
chapter *before* it so the arrows link both ways.

Plain Markdown works too — use a `.md` extension and write normally instead of
using HTML tags.

**Photos:** open `assets/roci`, use **Add file → Upload files**, and drag them
in. Keep them under about 2 MB each; anything from a phone should be resized
first.

## Adding a Moon landing post

Same idea, but the folder is `_moon` and the front matter is shorter:

```
---
layout: post
title: "Your title"
subtitle: "One line under the title"
date: "2026-08-01"
permalink: /moon/your-title/
---

<p>Write here.</p>
```

The list on `/moon/` picks it up automatically, newest first.

## Starting a whole new blog

Say you want the AI write-ups as their own section:

1. Add `ai:` under `collections:` in `_config.yml`, copying how `moon:` is
   written.
2. Create an `_ai` folder with one file per post.
3. Replace `ai/index.md` with a listing page — copy `moon/index.html` and
   change `site.moon` to `site.ai`.

The homepage card already exists and will start linking to real content.

## Adding an ordinary page

A page is one file in a folder named after the address you want. To create
`fratian.com/speaking/`, make a folder called `speaking` containing a file
called `index.md`:

```
---
title: Speaking
permalink: /speaking/
lede: One line under the heading.
---

Write here in plain Markdown.

## A subheading

- a list item
- another

A [link](https://example.com), and **bold** text.
```

That's the whole recipe. The three lines between the `---` markers are the
only required part:

| Line | What it does |
|---|---|
| `title:` | the heading, the browser tab, the name in search results |
| `permalink:` | the address — always start and end with `/` |
| `lede:` | optional grey line under the heading |

Use `.md` for text-heavy pages and `.html` when you want full control of the
markup (see `books/index.html` for a worked example with cards).

**To add it to the menu**, edit `_layouts/default.html` and copy one of the
existing `<a href=...>` lines in the `site-nav` block.

**To add a tile on the front page**, copy one of the `<li class="card">` blocks
in `index.html` and change the words. Add `card--soon` to the class and
`tag--soon` to the tag if it's a placeholder.

## Editing the ordinary pages

`index.html` is the front page, `about.md` is the about page, and
`travel/index.html` introduces the travel blog. Edit them directly.

## Where the travel content came from

The original blog ran on WordPress. When that was shut down the chapters
survived only as seven print-to-PDF exports. `tools/extract.py` reconstructs
them — text, photographs, links, captions and reader comments — and writes the
files in `_chapters`. It's kept here for reference; you don't need to run it
again unless more PDFs turn up.

Every chapter kept its original web address (`/rociandi/`,
`/roci-and-i-oh-canada/` and so on), so links shared back in 2024 still work.

## Previewing on your own machine (optional)

Not required — GitHub builds the real thing. But if you want to look before
publishing:

```sh
brew install ruby
gem install jekyll
jekyll serve
```

Then open <http://localhost:4000>.
