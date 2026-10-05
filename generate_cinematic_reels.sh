#!/bin/bash
set -e
mkdir -p public/videos

echo "Generating Video 1: Astral Soul Shift (Martial Combat / Energy Shift)..."
ffmpeg -y -f lavfi -i "mandelbrot=s=540x960:rate=30:maxiter=50" \
  -f lavfi -i "sine=frequency=140:duration=5" \
  -vf "hue=h=120*t:s=1.8,eq=contrast=1.3:brightness=0.08" \
  -t 5 -c:v libx264 -preset fast -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 64k -shortest public/videos/video_1_motion_ref.mp4

echo "Generating Video 2: Cinema Screen Tsunami (Wave Physics)..."
ffmpeg -y -f lavfi -i "testsrc2=s=540x960:r=30" \
  -f lavfi -i "sine=frequency=95:duration=5" \
  -vf "hue=h=200+40*sin(t*2):s=2,eq=contrast=1.4:brightness=0.05" \
  -t 5 -c:v libx264 -preset fast -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 64k -shortest public/videos/video_2_cinema_wave.mp4

echo "Generating Video 3: Helicopter Fjord Freefall (Aerodynamics)..."
ffmpeg -y -f lavfi -i "mandelbrot=s=540x960:rate=30:maxiter=45" \
  -f lavfi -i "sine=frequency=180:duration=5" \
  -vf "hue=h=180+60*cos(t*1.5):s=1.5,eq=contrast=1.2:brightness=0.1" \
  -t 5 -c:v libx264 -preset fast -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 64k -shortest public/videos/video_3_helicopter_jump.mp4

echo "Generating Video 4: Volcano Popcorn Eruption (Magma Fire Burst)..."
ffmpeg -y -f lavfi -i "testsrc2=s=540x960:r=30" \
  -f lavfi -i "sine=frequency=130:duration=5" \
  -vf "hue=h=30+20*sin(t*3):s=2.5,eq=contrast=1.5:brightness=0.1" \
  -t 5 -c:v libx264 -preset fast -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 64k -shortest public/videos/video_4_volcano_cats.mp4

echo "Generating Video 5: Molten Lava Arctic Geyser (Thermal Geyser)..."
ffmpeg -y -f lavfi -i "mandelbrot=s=540x960:rate=30:maxiter=45" \
  -f lavfi -i "sine=frequency=160:duration=5" \
  -vf "hue=h=280+90*sin(t*2):s=2,eq=contrast=1.3:brightness=0.05" \
  -t 5 -c:v libx264 -preset fast -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 64k -shortest public/videos/video_5_lava_arctic.mp4

echo "All 5 videos generated successfully with FastStart and Baseline profile!"
