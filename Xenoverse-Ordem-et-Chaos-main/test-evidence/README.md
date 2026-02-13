# Automated Test Evidence Recording

This directory contains automated test evidence recording tools for the Xenoverse Dex application.

## Files

- **`record-demo.js`** - Playwright script that automates browser testing and records video
- **`package.json`** - Dependencies (Playwright)
- **`videos/`** - Output directory for recorded videos

## Generated Video

📹 **`videos/xenoverse-dex-full-demo.webm`** (10 MB)

A complete automated walkthrough of all Xenoverse Dex features recorded at 1920x1080 resolution.

## What's Recorded

The automated script tests and records:

1. **Home Page** - Pokédex grid with 1,188 species
2. **Species Page** - Trishout (#1301) with all sections
3. **Stats Tab** - Base stats + Lv.100 ranges
4. **Data Tab** - Species information
5. **Learnset Tab** - All learn methods (Breeding, Level, Move Tutor)
6. **Evolution Tab** - Evolution chains
7. **Forms Tab** - All 4 forms with descriptions
8. **Form Switching** - Terrestrial, Xenoversal, and Astral forms
9. **Types Page** - Type chart with 19 types
10. **Abilities Page** - 347 abilities with search
11. **Moves Page** - 932 moves with filters
12. **Compare Page** - Side-by-side comparison tool
13. **Navigation** - Full app navigation flow

## Running the Automation

### Prerequisites

```bash
# Install dependencies (first time only)
cd test-evidence
npm install
npx playwright install chromium
npx playwright install-deps chromium  # System dependencies
```

### Record New Video

```bash
# Make sure the dev server is running on port 3001
npm run dex:dev

# In another terminal, run the recording
cd test-evidence
npm run record
```

The video will be saved to `videos/` directory.

## Script Details

- **Resolution:** 1920x1080
- **Format:** WebM (VP8/VP9 codec)
- **Duration:** ~2 minutes
- **Browser:** Chromium (headless)
- **Wait times:** 2-3 seconds between actions for visibility

## Customization

Edit `record-demo.js` to:
- Change video resolution in `recordVideo.size`
- Adjust wait times between actions
- Add/remove test steps
- Change output directory

## Troubleshooting

**Video not playing:**
- WebM format is supported by most modern browsers
- Use VLC or Chrome to view
- Convert to MP4: `ffmpeg -i video.webm video.mp4`

**Script timing out:**
- Increase wait times in `wait()` calls
- Check that dev server is running on port 3001
- Ensure Playwright browser is installed

**Display issues (WSL):**
- Script runs in headless mode for WSL compatibility
- No X server required
- Video is rendered offscreen

## Video Format Conversion

Convert WebM to MP4 (more compatible):

```bash
ffmpeg -i videos/xenoverse-dex-full-demo.webm -c:v libx264 -preset slow -crf 22 videos/xenoverse-dex-full-demo.mp4
```

## CI/CD Integration

This script can run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install Playwright
  run: |
    cd test-evidence
    npm install
    npx playwright install chromium --with-deps

- name: Start dev server
  run: npm run dex:dev &

- name: Record demo
  run: |
    cd test-evidence
    npm run record

- name: Upload video
  uses: actions/upload-artifact@v3
  with:
    name: test-evidence-video
    path: test-evidence/videos/*.webm
```
