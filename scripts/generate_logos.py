#!/usr/bin/env python3
import math
from PIL import Image, ImageDraw, ImageFont

def create_emblem(size=512):
    # Create image with RGBA
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale factor
    s = size / 512.0

    # Draw rounded rectangle background (Squircle)
    # Slate 900 gradient simulated or dark slate #0F172A
    radius = int(110 * s)
    margin = int(24 * s)
    box = [margin, margin, size - margin, size - margin]
    
    # We can draw the squircle in Slate-900 (#0F172A)
    draw.rounded_rectangle(box, radius=radius, fill=(15, 23, 42, 255))
    
    # Subtle inner border (#334155 / Slate-700)
    draw.rounded_rectangle(box, radius=radius, outline=(51, 65, 85, 255), width=max(1, int(4 * s)))

    # Inside Symbol: Dynamic Modern Sports "S" + Court / Stadium
    # Let's draw modern athletic geometric ribbons/polygons in crisp pure white and sky-blue accent
    
    # Top dynamic wing
    p1 = (int(160 * s), int(160 * s))
    p2 = (int(360 * s), int(160 * s))
    p3 = (int(310 * s), int(230 * s))
    p4 = (int(190 * s), int(230 * s))
    draw.polygon([p1, p2, p3, p4], fill=(248, 250, 252, 255))
    
    # Middle diagonal dynamic bridge (connecting top & bottom forming 'S')
    p5 = (int(190 * s), int(230 * s))
    p6 = (int(260 * s), int(230 * s))
    p7 = (int(320 * s), int(285 * s))
    p8 = (int(250 * s), int(285 * s))
    draw.polygon([p5, p6, p7, p8], fill=(56, 189, 248, 255)) # Sky Blue Accent
    
    # Bottom dynamic wing
    p9 = (int(152 * s), int(285 * s))
    p10 = (int(322 * s), int(285 * s))
    p11 = (int(352 * s), int(355 * s))
    p12 = (int(152 * s), int(355 * s))
    draw.polygon([p9, p10, p11, p12], fill=(248, 250, 252, 255))
    
    # Dynamic sports ball / accent spark in top right of bottom curve
    spark_center = (int(355 * s), int(195 * s))
    r_spark = int(22 * s)
    draw.ellipse(
        [spark_center[0] - r_spark, spark_center[1] - r_spark, spark_center[0] + r_spark, spark_center[1] + r_spark],
        fill=(56, 189, 248, 255)
    )

    return img

if __name__ == "__main__":
    emblem_512 = create_emblem(512)
    emblem_512.save("apps/web/public/logo-256.png")
    emblem_512.save("apps/web/public/logo-cropped.png")
    emblem_512.save("apps/web/public/apple-touch-icon.png")
    
    emblem_64 = create_emblem(64)
    emblem_64.save("apps/web/public/favicon-64.png")
    print("PNGs created successfully!")
