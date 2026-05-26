# Carrier Site Playbook

A repeatable process for spinning up a clean, single-page marketing website for a
freight carrier (or similar small business) in a fresh Claude Code session — one
session per client. Built and proven on the JBD Transit LLC site in this repo;
use that as the reference implementation.

---

## TL;DR — kickoff prompt for a new session

Paste this into a new Claude Code session (fill in the brackets), then follow
Claude's lead. It front-loads the things that otherwise cost a few round-trips.

```
I need a marketing website for [COMPANY NAME], a freight carrier (USDOT [NUMBER]).
Build a polished single-page static site (HTML/CSS/JS, no build step) following the
conventions in CARRIER_SITE_PLAYBOOK.md.

Source of truth for company facts: I'll paste the FMCSA SAFER "Company Snapshot"
screenshot (legal name, address, phone, power units, drivers, cargo carried,
safety/inspection record). Build the copy and services around the cargo types and
lean on the safety record if it's clean.

Branding: I will COMMIT the logo and photos into the repo (not paste them in chat —
chat images aren't accessible as files). Pull the brand colors from the logo.

Develop on branch claude/[client]-website, verify with a headless-browser screenshot
on desktop + mobile before saying it's done, then push. Set up GitHub Pages from main.
```

---

## Read first — gotchas that waste time

These are the things that are not obvious and cost the most rework:

1. **Images pasted into the chat are NOT files Claude can open.** Claude can *see*
   them, but cannot read the bytes to compress/embed them. The client must **commit
   the logo + photos to the repo** (or upload via GitHub's web UI: *Add file →
   Upload files*). Tell them this up front.
2. **FMCSA SAFER and carrier-data aggregators (carriersource, otrucking,
   brokersnapshot, etc.) return HTTP 403 to automated fetches.** Don't burn turns
   trying to `WebFetch`/`curl` them. Web *search* snippets sometimes leak a few
   facts, but the reliable path is a **client-provided SAFER screenshot**.
3. **There are often multiple carriers with the same name.** Confirm the exact
   **USDOT number** before building — names, addresses, and services differ.
4. **Raw photos are huge** (2–8 MB phone/AI images). Always compress (see snippet
   below) — target ~200–350 KB each, ~2 MB total. Logos are often multi-MB PNGs with
   wasted transparent borders; trim + resize.
5. **Verify before claiming done.** The cloud env has Playwright + Chromium
   (`/opt/node22/lib/node_modules/playwright`). Render desktop **and** mobile
   screenshots and actually look at them.
6. **Match copy to the real operation.** Cargo "oilfield equipment / lumber / steel
   coils / building materials" = a *flatbed/open-deck* carrier, not dry van. Read
   the SAFER cargo list and position accordingly.

---

## What to collect from the client

- [ ] **USDOT number** (disambiguates the carrier) — and a SAFER Company Snapshot
      screenshot: legal name, DBA, physical + mailing address, phone, power units,
      drivers, operation type, cargo carried, inspections/crashes/safety rating.
- [ ] **Logo** file, committed to the repo.
- [ ] **Photos** (trucks, drivers, equipment), committed to the repo.
- [ ] **Real contact email** for the quote form (SAFER usually has phone, rarely email).
- [ ] Any service/positioning notes the SAFER data doesn't capture.

---

## Step-by-step

1. **Branch** — `git checkout -b claude/[client]-website`. Develop there; merge to
   `main` once the client is happy (Pages serves from `main`).
2. **Gather data** — get the SAFER snapshot; confirm the USDOT. Derive services from
   the cargo list; note the safety record (a clean 0% OOS / 0 crashes record is a
   strong selling point worth a dedicated section).
3. **Skeleton** — build the section structure (below) with real copy.
4. **Brand** — pull the palette from the logo into CSS `:root` tokens (below).
5. **Assets** — organize into `assets/`, compress (snippet below), generate a white
   logo variant for dark backgrounds.
6. **Integrate** — logo in header/footer, hero background photo, photos through the
   page, a fleet gallery.
7. **Verify** — Playwright screenshots, desktop + mobile; check contrast, coverage,
   layout. Fix, re-render.
8. **Ship** — commit, push the branch, fast-forward `main`, push `main`. Enable
   GitHub Pages (*Settings → Pages → Deploy from a branch → main / root*). URL:
   `https://[user].github.io/[repo]/`.

---

## Site structure (sections)

Sticky header (logo + nav + "Get a Quote") → **Hero** (headline + sub + CTAs + trust
stats over a photo) → **Trust strip** (4 quick value props) → **Services** (card grid
built from the cargo types) → **About** (photo + story + stat row: power units,
drivers, miles/yr, crashes) → **Fleet gallery** (photo mosaic) → **Safety** (big
stats vs national averages + compliance points) → **Coverage** (copy + photo, HQ
badge) → **Contact** (info + quote form) → Footer (white logo, nav, USDOT/MC).

---

## Tech & conventions

- **Stack:** plain HTML + CSS + vanilla JS. **No build step** — opens via `file://`
  and deploys to any static host. Fonts via Google Fonts (Inter + Barlow Condensed).
- **File layout:**
  ```
  index.html
  styles.css
  script.js
  assets/
    logo/   jbd-transit-logo.png, jbd-transit-logo-white.png
    img/    descriptive-names.jpg  (e.g. highway-sunset.jpg, driver-portrait.jpg)
  ```
- **Design tokens** — rebrand by editing these in `:root`:
  ```css
  --brand        /* primary accent (buttons, links) — mid tone from logo */
  --brand-dark   /* hover */
  --brand-bright /* gradient end */
  --deep         /* dark sections / headings — darkest brand tone */
  --pop          /* light accent for text on dark bg (readable!) */
  ```
  On dark backgrounds use `--pop` (light), never `--brand` (mid-tone reads poorly).
  There's an `.eyebrow.light` helper for exactly this.
- **Logo:** trim transparent border, resize to ~760px wide PNG. Make a **white
  variant** for the dark footer by painting RGB white where alpha > 0.
- **Hero photo technique** (so the subject isn't behind the text): put the image in
  an absolutely-positioned `<img class="hero-bg">` layer with `object-fit:cover`,
  give it `width:135%` and a `left:` offset to push the subject sideways, then lay a
  **directional gradient** (`linear-gradient(90deg, dark 26%, lighter 82%)`) over it
  so the headline side stays dark/legible. This keeps full coverage on mobile (a
  zoomed CSS `background-size` percentage does not).
- **Quote form:** `script.js` builds a `mailto:` with the fields prefilled. Swap in a
  real backend (Formspree / Netlify Forms / Web3Forms) for production so submissions
  send without opening a mail client. Set the real recipient email.
- **Responsive:** mobile nav toggle; grids collapse at 940 / 720 / 520px.
- **Accessibility:** alt text on photos (decorative hero img `alt=""`), `loading="lazy"`
  on below-the-fold images, sufficient contrast on dark sections.

---

## Image compression (Pillow)

`pip install Pillow` is available in the cloud env. Resize/re-encode photos and
trim/optimize the logo:

```python
from PIL import Image, ImageOps
# Photos -> max 1920w, progressive JPEG q82
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
if im.width > 1920:
    im = im.resize((1920, round(im.height*1920/im.width)), Image.LANCZOS)
im.save(out, "JPEG", quality=82, optimize=True, progressive=True)

# Logo -> trim transparent border, resize, optimize
logo = Image.open("logo.png").convert("RGBA")
logo = logo.crop(logo.split()[3].getbbox())          # trim by alpha
logo = logo.resize((760, round(logo.height*760/logo.width)), Image.LANCZOS)
logo.save("assets/logo/logo.png", "PNG", optimize=True)

# White variant for dark footer
r, g, b, a = logo.split()
Image.merge("RGBA", (a.point(lambda _:255),)*3 + (a,)).save(
    "assets/logo/logo-white.png", "PNG", optimize=True)
```

Typical result: ~30 MB of raw uploads → ~2 MB.

---

## Verify with a headless browser

```bash
export NODE_PATH=/opt/node22/lib/node_modules
node -e "const{chromium}=require('playwright');(async()=>{
  const b=await chromium.launch();
  for(const [k,w,h] of [['desktop',1440,900],['mobile',390,844]]){
    const p=await b.newPage({viewport:{width:w,height:h}});
    await p.goto('file://'+process.cwd()+'/index.html',{waitUntil:'networkidle'});
    await p.screenshot({path:'/tmp/'+k+'.png',fullPage:true});
  }
  await b.close();
})()"
```
Then open the screenshots and actually review them.

---

## Per-client checklist

- [ ] USDOT confirmed; SAFER snapshot received
- [ ] Logo + photos committed to repo
- [ ] Palette pulled from logo into `:root`
- [ ] Services match real cargo types
- [ ] Safety section uses real numbers
- [ ] Images compressed & organized in `assets/`
- [ ] White logo variant for footer
- [ ] Real contact email in the form (or form backend wired)
- [ ] Desktop + mobile screenshots reviewed
- [ ] Merged to `main`, pushed, GitHub Pages live
- [ ] Legal name vs. brand name confirmed with client

---

## Notes on scaling this repo

This repo (`carrier_sites`) currently hosts one site at the root. To host several
from one repo, give each client a subfolder (`/jbd-transit/`, `/acme-freight/`) and
publish with Pages — each is reachable at `…github.io/carrier_sites/<client>/`.
Otherwise, one repo per client keeps Pages URLs clean (`…github.io/<client>/`) and
isolates each engagement. Either way, the per-client build process above is identical.
