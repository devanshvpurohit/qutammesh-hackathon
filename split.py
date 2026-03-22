from PIL import Image

img = Image.open('public/assets/guts.png').convert('RGBA')

# Let's count non-empty vertical strips
w, h = img.size
strips = []
empty = True
start = 0

for x in range(w):
    col_empty = True
    for y in range(h):
        r, g, b, a = img.getpixel((x, y))
        if a > 0:
            col_empty = False
            break
    if not col_empty and empty:
        start = x
        empty = False
    elif col_empty and not empty:
        strips.append((start, x))
        empty = True
if not empty:
    strips.append((start, w))

print("Found non-empty regions (x-spans):", strips)
