import os
from PIL import Image, ImageDraw

def create_icon():
    os.makedirs("icons", exist_ok=True)
    sizes = [16, 32, 48, 128]
    
    # Render at high resolution (1024x1024) and downscale with Lanczos for crisp anti-aliasing
    base_size = 1024
    img = Image.new("RGBA", (base_size, base_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer circle with vibrant emerald accent
    margin = 40
    draw.ellipse([margin, margin, base_size - margin, base_size - margin], fill=(16, 185, 129, 255))
    
    # Inner circle slate background
    inner_margin = 80
    draw.ellipse([inner_margin, inner_margin, base_size - inner_margin, base_size - inner_margin], fill=(15, 23, 42, 255))
    
    # Lock shackle (curved arch)
    shackle_box = [360, 240, 664, 540]
    draw.arc(shackle_box, start=180, end=0, fill=(255, 255, 255, 255), width=70)
    
    # Lock body (rounded rectangle in crimson red matching copy button)
    lock_body = [310, 470, 714, 820]
    draw.rounded_rectangle(lock_body, radius=60, fill=(214, 26, 76, 255))
    
    # Keyhole
    draw.ellipse([472, 570, 552, 650], fill=(255, 255, 255, 255))
    draw.polygon([(486, 620), (538, 620), (550, 720), (474, 720)], fill=(255, 255, 255, 255))
    
    # Sparkle / star accent (top right)
    sparkle_x, sparkle_y = 730, 290
    draw.ellipse([sparkle_x - 35, sparkle_y - 35, sparkle_x + 35, sparkle_y + 35], fill=(52, 211, 153, 255))
    
    for s in sizes:
        resized = img.resize((s, s), Image.Resampling.LANCZOS)
        out_path = os.path.join("icons", f"icon-{s}.png")
        resized.save(out_path, "PNG")
        print(f"Generated {out_path} ({s}x{s})")

if __name__ == "__main__":
    create_icon()
