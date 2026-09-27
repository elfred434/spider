"""Generate an original stylized Web Runner model as a self-contained GLB file.

The model is deliberately original: it is a geometric superhero avatar for the
Web Glide browser prototype and does not use any protected character assets.
"""
from __future__ import annotations

import json
import math
import struct
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
TEXTURE_DIR = ROOT / "textures"
MODEL_DIR.mkdir(exist_ok=True)
TEXTURE_DIR.mkdir(exist_ok=True)

# --------------------------- GLB builder ---------------------------

buffer = bytearray()
buffer_views = []
accessors = []
meshes = []
nodes = []


def align4() -> None:
    while len(buffer) % 4:
        buffer.append(0)


def add_accessor(values: Iterable, component_type: int, accessor_type: str,
                 target: int, fmt: str, count: int, min_value=None, max_value=None) -> int:
    align4()
    offset = len(buffer)
    values = list(values)
    if values:
        buffer.extend(struct.pack("<" + fmt * len(values), *values))
    byte_length = len(buffer) - offset
    view = {"buffer": 0, "byteOffset": offset, "byteLength": byte_length, "target": target}
    buffer_views.append(view)
    accessor = {
        "bufferView": len(buffer_views) - 1,
        "componentType": component_type,
        "count": count,
        "type": accessor_type,
    }
    if min_value is not None:
        accessor["min"] = min_value
    if max_value is not None:
        accessor["max"] = max_value
    accessors.append(accessor)
    return len(accessors) - 1


def add_mesh(vertices, normals, uvs, indices, material_index: int, name: str) -> int:
    position_count = len(vertices) // 3
    pos = [vertices[i:i + 3] for i in range(0, len(vertices), 3)]
    pos_min = [min(v[i] for v in pos) for i in range(3)]
    pos_max = [max(v[i] for v in pos) for i in range(3)]
    position_accessor = add_accessor(vertices, 5126, "VEC3", 34962, "f", position_count, pos_min, pos_max)
    normal_accessor = add_accessor(normals, 5126, "VEC3", 34962, "f", len(normals) // 3)
    uv_accessor = add_accessor(uvs, 5126, "VEC2", 34962, "f", len(uvs) // 2)
    index_fmt = "H" if max(indices, default=0) < 65536 else "I"
    index_type = 5123 if index_fmt == "H" else 5125
    index_accessor = add_accessor(indices, index_type, "SCALAR", 34963, index_fmt, len(indices))
    mesh = {
        "name": name,
        "primitives": [{
            "attributes": {"POSITION": position_accessor, "NORMAL": normal_accessor, "TEXCOORD_0": uv_accessor},
            "indices": index_accessor,
            "material": material_index,
        }],
    }
    meshes.append(mesh)
    return len(meshes) - 1


def quat_from_euler(rx=0.0, ry=0.0, rz=0.0):
    # XYZ Euler order.
    cx, sx = math.cos(rx / 2), math.sin(rx / 2)
    cy, sy = math.cos(ry / 2), math.sin(ry / 2)
    cz, sz = math.cos(rz / 2), math.sin(rz / 2)
    return [
        sx * cy * cz - cx * sy * sz,
        cx * sy * cz + sx * cy * sz,
        cx * cy * sz - sx * sy * cz,
        cx * cy * cz + sx * sy * sz,
    ]


def add_node(name, mesh_index, translation=(0, 0, 0), scale=(1, 1, 1), rotation=(0, 0, 0)):
    node = {
        "name": name,
        "mesh": mesh_index,
        "translation": list(translation),
        "scale": list(scale),
    }
    if any(abs(value) > 1e-8 for value in rotation):
        node["rotation"] = quat_from_euler(*rotation)
    nodes.append(node)


def add_box(name, translation, scale, material, rotation=(0, 0, 0)):
    # Unit box from -1 to +1, with independent UVs for each face.
    faces = [
        ([( -1,-1, 1), ( 1,-1, 1), ( 1, 1, 1), (-1, 1, 1)], (0,0,1)),
        ([( 1,-1,-1), (-1,-1,-1), (-1, 1,-1), ( 1, 1,-1)], (0,0,-1)),
        ( [(-1,-1,-1), (-1,-1, 1), (-1, 1, 1), (-1, 1,-1)], (-1,0,0)),
        ([( 1,-1, 1), ( 1,-1,-1), ( 1, 1,-1), ( 1, 1, 1)], (1,0,0)),
        ( [(-1, 1, 1), ( 1, 1, 1), ( 1, 1,-1), (-1, 1,-1)], (0,1,0)),
        ( [(-1,-1,-1), ( 1,-1,-1), ( 1,-1, 1), (-1,-1, 1)], (0,-1,0)),
    ]
    uv_face = [(0, 0), (1, 0), (1, 1), (0, 1)]
    vertices, normals, uvs, indices = [], [], [], []
    for face, normal in faces:
        start = len(vertices) // 3
        for vertex, uv in zip(face, uv_face):
            vertices.extend(vertex)
            normals.extend(normal)
            uvs.extend(uv)
        indices.extend([start, start + 1, start + 2, start, start + 2, start + 3])
    mesh = add_mesh(vertices, normals, uvs, indices, material, name)
    add_node(name, mesh, translation, scale, rotation)


def add_sphere(name, translation, scale, material, segments=20, rings=12):
    vertices, normals, uvs, indices = [], [], [], []
    for ring in range(rings + 1):
        v = ring / rings
        phi = v * math.pi
        for segment in range(segments + 1):
            u = segment / segments
            theta = u * math.pi * 2
            x = math.sin(phi) * math.cos(theta)
            y = math.cos(phi)
            z = math.sin(phi) * math.sin(theta)
            vertices.extend([x, y, z])
            normals.extend([x, y, z])
            uvs.extend([u, v])
    for ring in range(rings):
        for segment in range(segments):
            a = ring * (segments + 1) + segment
            b = a + 1
            c = a + segments + 1
            d = c + 1
            indices.extend([a, c, b, b, c, d])
    mesh = add_mesh(vertices, normals, uvs, indices, material, name)
    add_node(name, mesh, translation, scale)


def add_web_line(name, a, b, width, material):
    ax, ay, az = a
    bx, by, bz = b
    dx, dy = bx - ax, by - ay
    length = math.hypot(dx, dy)
    if length == 0:
        return
    angle = math.atan2(-dx, dy)
    add_box(name, ((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), (width, length / 2, width), material, (0, 0, angle))


# --------------------------- Materials ----------------------------

materials = [
    {"name": "Suit Navy", "pbrMetallicRoughness": {"baseColorFactor": [0.018, 0.055, 0.16, 1], "metallicFactor": 0.15, "roughnessFactor": 0.38}},
    {"name": "Suit Blue Panels", "pbrMetallicRoughness": {"baseColorFactor": [0.035, 0.18, 0.35, 1], "metallicFactor": 0.2, "roughnessFactor": 0.32}},
    {"name": "Crimson Panels", "pbrMetallicRoughness": {"baseColorFactor": [0.82, 0.035, 0.10, 1], "metallicFactor": 0.08, "roughnessFactor": 0.35}},
    {"name": "Bright Crimson", "pbrMetallicRoughness": {"baseColorFactor": [1.0, 0.10, 0.16, 1], "metallicFactor": 0.1, "roughnessFactor": 0.3}},
    {"name": "Web Cyan", "pbrMetallicRoughness": {"baseColorFactor": [0.08, 0.75, 1.0, 1], "metallicFactor": 0.35, "roughnessFactor": 0.2}, "emissiveFactor": [0.02, 0.25, 0.4]},
    {"name": "Visor White", "pbrMetallicRoughness": {"baseColorFactor": [0.75, 0.95, 1.0, 1], "metallicFactor": 0.25, "roughnessFactor": 0.16}, "emissiveFactor": [0.08, 0.2, 0.28]},
    {"name": "Gold Belt", "pbrMetallicRoughness": {"baseColorFactor": [1.0, 0.48, 0.06, 1], "metallicFactor": 0.65, "roughnessFactor": 0.23}},
    {"name": "Mask Black", "pbrMetallicRoughness": {"baseColorFactor": [0.008, 0.012, 0.035, 1], "metallicFactor": 0.12, "roughnessFactor": 0.27}},
]

# --------------------------- Character ----------------------------

# Torso and chest.
add_box("Torso", (0, 1.18, 0), (0.93, 1.10, 0.58), 0)
add_box("Chest Crimson Plate", (0, 1.30, 0.60), (0.70, 0.70, 0.075), 2)
add_box("Left Blue Side Panel", (-0.78, 1.22, 0.02), (0.13, 0.80, 0.60), 1)
add_box("Right Blue Side Panel", (0.78, 1.22, 0.02), (0.13, 0.80, 0.60), 1)
add_box("Gold Utility Belt", (0, 0.27, 0.02), (0.98, 0.16, 0.64), 6)
add_box("Cyan Belt Core", (0, 0.27, 0.68), (0.20, 0.18, 0.06), 4)

# Chest web rays and rings.
front = 0.70
add_web_line("Chest Web Vertical", (0, 0.68, front), (0, 1.98, front), .028, 4)
add_web_line("Chest Web Diagonal L", (-0.55, 0.88, front), (0.55, 1.80, front), .028, 4)
add_web_line("Chest Web Diagonal R", (0.55, 0.88, front), (-0.55, 1.80, front), .028, 4)
for i, yy in enumerate((0.98, 1.28, 1.60)):
    half = 0.50 if yy < 1.1 else (0.61 if yy < 1.45 else 0.48)
    add_web_line(f"Chest Web Ring L {i}", (-half, yy + 0.10, front), (0, yy, front), .024, 4)
    add_web_line(f"Chest Web Ring R {i}", (0, yy, front), (half, yy + 0.10, front), .024, 4)

# Emblem.
add_box("Emblem Slash A", (0, 1.48, 0.735), (0.065, 0.34, 0.035), 5, (0, 0, math.pi / 4))
add_box("Emblem Slash B", (0, 1.48, 0.74), (0.065, 0.34, 0.035), 4, (0, 0, -math.pi / 4))

# Head, visor and mask details.
add_box("Neck", (0, 2.02, 0), (0.27, 0.25, 0.27), 7)
add_sphere("Helmet", (0, 2.76, 0), (0.72, 0.78, 0.72), 7)
add_box("Cyan Visor", (0, 2.79, 0.56), (0.53, 0.31, 0.08), 4)
add_box("Left Eye", (-0.22, 2.82, 0.66), (0.13, 0.22, 0.035), 5, (0, 0, -0.18))
add_box("Right Eye", (0.22, 2.82, 0.66), (0.13, 0.22, 0.035), 5, (0, 0, 0.18))
add_web_line("Mask Web Vertical", (0, 2.48, 0.64), (0, 3.30, 0.64), .022, 4)
add_web_line("Mask Web Left", (-0.48, 2.65, 0.58), (0, 2.75, 0.68), .020, 4)
add_web_line("Mask Web Right", (0, 2.75, 0.68), (0.48, 2.65, 0.58), .020, 4)
add_box("Helmet Crest", (0, 3.37, -0.20), (0.18, 0.28, 0.16), 2, (0, 0, 0.12))

# Shoulders, arms, hands.
add_sphere("Left Shoulder", (-0.98, 1.85, 0), (0.37, 0.40, 0.44), 3)
add_sphere("Right Shoulder", (0.98, 1.85, 0), (0.37, 0.40, 0.44), 3)
add_box("Left Arm", (-1.04, 0.95, 0.10), (0.27, 0.90, 0.27), 2, (0, 0, -0.13))
add_box("Right Arm", (1.04, 0.95, 0.04), (0.27, 0.90, 0.27), 2, (0, 0, 0.13))
add_sphere("Left Glove", (-1.10, 0.03, 0.16), (0.30, 0.30, 0.30), 4)
add_sphere("Right Glove", (1.10, 0.03, 0.11), (0.30, 0.30, 0.30), 4)
add_box("Left Glove Web Mark", (-1.10, 0.03, 0.42), (0.12, 0.18, 0.06), 5)
add_box("Right Glove Web Mark", (1.10, 0.03, 0.37), (0.12, 0.18, 0.06), 5)

# Legs, knee accents and boots.
add_box("Left Leg", (-0.43, -0.80, 0), (0.31, 0.95, 0.31), 0, (0, 0, -0.04))
add_box("Right Leg", (0.43, -0.80, 0), (0.31, 0.95, 0.31), 0, (0, 0, 0.04))
add_box("Left Knee Accent", (-0.43, -0.18, 0.33), (0.26, 0.22, 0.035), 4)
add_box("Right Knee Accent", (0.43, -0.18, 0.33), (0.26, 0.22, 0.035), 4)
add_box("Left Boot", (-0.43, -1.78, 0.13), (0.40, 0.20, 0.62), 2, (0.12, 0, 0))
add_box("Right Boot", (0.43, -1.78, 0.13), (0.40, 0.20, 0.62), 2, (0.12, 0, 0))

# --------------------------- Texture reference --------------------

def create_suit_texture(path: Path):
    image = Image.new("RGBA", (512, 512), (7, 16, 43, 255))
    draw = ImageDraw.Draw(image)
    # Blue technical-fabric gradient bands.
    for y in range(512):
        shade = int(12 + 20 * (1 - y / 512))
        draw.line((0, y, 512, y), fill=(5, shade, 42 + shade, 255))
    # Crimson chest panel.
    draw.rounded_rectangle((106, 65, 406, 420), radius=42, fill=(170, 15, 34, 255), outline=(255, 70, 77, 255), width=6)
    # Cyan web rays and rings.
    cx, cy = 256, 243
    for end in [(256, 50), (90, 120), (422, 120), (80, 355), (432, 355), (256, 450)]:
        draw.line((cx, cy, end[0], end[1]), fill=(110, 238, 255, 210), width=5)
    for radius in (55, 100, 148):
        box = (cx-radius, cy-radius*.70, cx+radius, cy+radius*.70)
        draw.arc(box, 200, 340, fill=(110, 238, 255, 210), width=4)
    draw.line((256, 180, 256, 330), fill=(220, 252, 255, 240), width=7)
    draw.line((210, 208, 302, 300), fill=(220, 252, 255, 220), width=7)
    draw.line((302, 208, 210, 300), fill=(220, 252, 255, 220), width=7)
    # Subtle fabric pixels.
    for x in range(0, 512, 16):
        draw.line((x, 0, x, 512), fill=(255, 255, 255, 12), width=1)
    for y in range(0, 512, 16):
        draw.line((0, y, 512, y), fill=(255, 255, 255, 10), width=1)
    image.save(path)


create_suit_texture(TEXTURE_DIR / "web_runner_suit.png")

# --------------------------- Write GLB -----------------------------

align4()
bin_chunk = bytes(buffer)
json_doc = {
    "asset": {"version": "2.0", "generator": "Web Glide custom model generator"},
    "scene": 0,
    "scenes": [{"name": "Web Runner", "nodes": list(range(len(nodes)))}],
    "nodes": nodes,
    "meshes": meshes,
    "materials": materials,
    "accessors": accessors,
    "bufferViews": buffer_views,
    "buffers": [{"byteLength": len(bin_chunk)}],
}
json_bytes = json.dumps(json_doc, separators=(",", ":")).encode("utf-8")
json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
bin_chunk += b"\x00" * ((4 - len(bin_chunk) % 4) % 4)

glb = bytearray()
glb.extend(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(json_bytes) + 8 + len(bin_chunk)))
glb.extend(struct.pack("<II", len(json_bytes), 0x4E4F534A))
glb.extend(json_bytes)
glb.extend(struct.pack("<II", len(bin_chunk), 0x004E4942))
glb.extend(bin_chunk)
(MODEL_DIR / "web_runner.glb").write_bytes(glb)

# A readable JSON manifest accompanies the binary model.
manifest = {
    "name": "Web Runner",
    "format": "glb",
    "materials": [m["name"] for m in materials],
    "generated_by": "tools/create_model.py",
    "original_design": True,
}
(MODEL_DIR / "web_runner_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(f"Created {MODEL_DIR / 'web_runner.glb'} ({len(glb):,} bytes)")
print(f"Created {TEXTURE_DIR / 'web_runner_suit.png'}")
