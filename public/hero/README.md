# Hero video

The homepage hero plays a looping, muted excavator clip. Drop the file(s) here:

- `hanox-hero.mp4` — H.264 MP4 (required; broadest support)
- `hanox-hero.webm` — VP9/AV1 WebM (optional; smaller, served first where supported)

Until a file exists, the hero shows the R10 photo poster — nothing breaks.

## Recommended encoding (keep it small & fast)
- **Length:** 6–12 s, seamless loop
- **Resolution:** 1280×960 or 1080p, **no audio track** (it's muted anyway)
- **Target size:** ≤ 4–6 MB so the page stays fast
- **Aspect:** roughly 4:3 / 5:4 (the card crops to `object-fit: cover`)

Example with ffmpeg (from a source clip `source.mov`):

```bash
# MP4 (H.264), no audio, ~10s starting at 2s
ffmpeg -ss 2 -t 10 -i source.mov -an -vf "scale=1280:-2" -c:v libx264 -crf 24 -preset slow -movflags +faststart hanox-hero.mp4
# WebM (VP9), no audio
ffmpeg -ss 2 -t 10 -i source.mov -an -vf "scale=1280:-2" -c:v libvpx-vp9 -crf 33 -b:v 0 hanox-hero.webm
```

Send me the raw clip and I can encode it for you.
