#!/usr/bin/env python3
"""Generate favicon for Distill Webhook Visualizer"""

from PIL import Image, ImageDraw
import io

# Create a 192x192 image (will be scaled down for favicon)
size = 192
img = Image.new('RGB', (size, size), color='#1a1a2e')
draw = ImageDraw.Draw(img)

# Draw a monitoring chart line
points = [
    (30, 140),
    (50, 110),
    (70, 120),
    (90, 70),
    (110, 90),
    (130, 50),
    (150, 40)
]

# Draw gradient-like line by drawing multiple offset lines
colors = ['#00d4ff', '#00e6ff', '#00f2dd', '#00ffaa', '#00ff99', '#00ff88']
for i in range(len(points) - 1):
    color_idx = min(i, len(colors) - 1)
    draw.line([points[i], points[i + 1]], fill=colors[color_idx], width=6)

# Draw data points
for x, y in points:
    draw.ellipse([x-6, y-6, x+6, y+6], fill='#00ff88', outline='#ffffff', width=2)

# Last point with highlight (animated in effect)
x, y = points[-1]
draw.ellipse([x-8, y-8, x+8, y+8], fill='#00ff88', outline='#ffffff', width=3)

# Draw webhook notification icon
webhook_x, webhook_y = 140, 150
# Notification circle
draw.ellipse([webhook_x-20, webhook_y-20, webhook_x+20, webhook_y+20],
             fill='#ff6b35', outline='#ffffff', width=2)
# Broadcast waves
draw.polygon([(webhook_x-8, webhook_y-5), (webhook_x-8, webhook_y+5), (webhook_x, webhook_y)],
             fill='#ffffff')
draw.polygon([(webhook_x, webhook_y-5), (webhook_x, webhook_y+5), (webhook_x+8, webhook_y)],
             fill='#ffffff')

# Save as ICO (favicon.ico)
img.save('/app/static/favicon.ico', format='ICO', sizes=[(32, 32), (64, 64)])

# Save as PNG files for web manifest
img_192 = img.resize((192, 192), Image.LANCZOS)
img_192.save('/app/static/logo192.png', 'PNG')

img_512 = img.resize((512, 512), Image.LANCZOS)
img_512.save('/app/static/logo512.png', 'PNG')

print("✅ Favicon generated successfully!")
print("   - /app/static/favicon.ico (32x32, 64x64)")
print("   - /app/static/logo192.png")
print("   - /app/static/logo512.png")
