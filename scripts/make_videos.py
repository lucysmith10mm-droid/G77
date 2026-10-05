import subprocess
import os

os.makedirs('public/videos', exist_ok=True)

font = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'

videos = [
    {
        'file': 'public/videos/video_1_motion_ref.mp4',
        'title': 'SEEDANCE 2.5',
        'subtitle': 'Motion Reference & Astral Shift',
        'badge': 'SEEDANCE 2.5',
        'prompt': 'Astral soul displacement martial arts combat sequence, depth-map driven multi-character spatio-temporal tracking',
        'color0': '0x1c0c30',
        'color1': '0x5e165e',
    },
    {
        'file': 'public/videos/video_2_cinema_wave.mp4',
        'title': 'SEEDANCE 2.0',
        'subtitle': 'Cinema Ocean Tsunami',
        'badge': 'SEEDANCE 2.0',
        'prompt': 'A massive ocean tsunami wave breaks through a 4K IMAX cinema screen, flooding seats with hyper-realistic frothing sea foam',
        'color0': '0x02162e',
        'color1': '0x006699',
    },
    {
        'file': 'public/videos/video_3_helicopter_jump.mp4',
        'title': 'SEEDANCE 2.0',
        'subtitle': 'Helicopter Fjord Freefall',
        'badge': 'SEEDANCE 2.0',
        'prompt': 'Extreme wingsuit freefall from helicopter open door into a Norwegian fjord chasm, zero-gravity camera rotation',
        'color0': '0x0b1d3a',
        'color1': '0x295270',
    },
    {
        'file': 'public/videos/video_4_volcano_cats.mp4',
        'title': 'SEEDANCE 2.5',
        'subtitle': 'Volcano Popcorn Eruption',
        'badge': 'SEEDANCE 2.5',
        'prompt': 'Fluffy Maine Coon cats dumping giant barrel of cheese balls into boiling magma crater, triggering huge popcorn explosion',
        'color0': '0x400e00',
        'color1': '0x992200',
    },
    {
        'file': 'public/videos/video_5_lava_arctic.mp4',
        'title': 'SEEDANCE 2.0',
        'subtitle': 'Molten Lava Arctic Geyser',
        'badge': 'SEEDANCE 2.0',
        'prompt': 'Worker in yellow hazard helmet drops white-hot molten crucible into arctic ice hole, blast geyser erupting frozen fish',
        'color0': '0x122436',
        'color1': '0xcc3700',
    },
]

for v in videos:
    print(f"Rendering {v['file']}...")
    filter_complex = (
        f"gradients=s=540x960:d=5:r=30:c0={v['color0']}:c1={v['color1']}:x0=0:y0=0:x1=540:y1=960,"
        f"hue=h='t*15':s='1+0.2*sin(t*2)',"
        f"drawbox=y=0:x=0:w=540:h=960:color=black@0.25:t=fill,"
        # Top badges
        f"drawtext=fontfile={font}:text='{v['badge']}':fontcolor=white:fontsize=26:x=(w-text_w)/2:y=60:shadowcolor=black:shadowx=2:shadowy=2,"
        f"drawtext=fontfile={font}:text='UNLIMITED DIFFUSION ENGINE':fontcolor=0x00f5d4:fontsize=13:x=(w-text_w)/2:y=98:shadowcolor=black:shadowx=1:shadowy=1,"
        # Outer framing border
        f"drawbox=x=30:y=150:w=480:h=620:color=white@0.15:t=2,"
        # Dynamic animated tracker scanning box
        f"drawbox=x='230+100*sin(t*1.8)':y='380+120*cos(t*1.4)':w=80:h=80:color=white@0.7:t=2,"
        # Bottom captions
        f"drawtext=fontfile={font}:text='{v['subtitle']}':fontcolor=white:fontsize=22:x=(w-text_w)/2:y=795:shadowcolor=black:shadowx=2:shadowy=2,"
        f"drawtext=fontfile={font}:text='{v['title']} • 4K @ 60 FPS Native':fontcolor=0xffd166:fontsize=13:x=(w-text_w)/2:y=830:shadowcolor=black:shadowx=1:shadowy=1,"
        f"drawtext=fontfile={font}:text='Zero Quota Limits • Official Model':fontcolor=0x90caf9:fontsize=12:x=(w-text_w)/2:y=855:shadowcolor=black:shadowx=1:shadowy=1"
    )
    cmd = [
        'ffmpeg', '-y',
        '-f', 'lavfi', '-i', filter_complex,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '22',
        '-pix_fmt', 'yuv420p',
        v['file']
    ]
    subprocess.run(cmd, check=True)

print("All 5 seed videos rendered successfully!")
