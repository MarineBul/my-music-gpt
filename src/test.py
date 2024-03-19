import subprocess
import os

path = "C:/Users/Marine/Documents/CO_uniandes/0_Tesis/MT_papers/WOI"
new_path = path.replace('/', '\\')

for picture in os.listdir(path):
    if '.png' in picture:
        new = picture.replace('.png', '')
        command = ["tesseract", picture, new]
        result = subprocess.run(["wsl"] + command, cwd=new_path, capture_output=True)