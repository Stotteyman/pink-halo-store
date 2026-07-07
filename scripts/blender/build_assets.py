"""Procedurally models Pink Halo boutique fixtures and exports each as a .glb.

Run headless with Blender 5.1+:
    blender --background --factory-startup --python scripts/blender/build_assets.py

Regenerate after editing this file to refresh the .glb files consumed by
src/components/three/PinkHaloScene.tsx. Nothing in the React app depends on
Blender at build time -- the .glb outputs are committed to the repo.
"""

import math
import os

import bpy

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "src", "assets", "models")
os.makedirs(OUT_DIR, exist_ok=True)

# Brand palette (docs/build-notes / projectgoals.md)
CHAMPAGNE_GOLD = (0xF4 / 255, 0xC2 / 255, 0x7A / 255)
ROSE_QUARTZ = (0xF8 / 255, 0xC8 / 255, 0xDC / 255)
BLUSH_GLOW = (0xFF / 255, 0xD9 / 255, 0xE8 / 255)
HALO_PINK = (0xFF / 255, 0x5F / 255, 0xA2 / 255)
DEEP_VELVET = (0x29 / 255, 0x11 / 255, 0x1B / 255)
MOONLIGHT_CREAM = (0xFF / 255, 0xF3 / 255, 0xEE / 255)
SAGE = (0x8C / 255, 0xA6 / 255, 0x87 / 255)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block_list in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(block_list):
            if block.users == 0:
                block_list.remove(block)


def make_material(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def shade_smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True


def add_bevel(obj, width=0.012, segments=2):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"


def new_objects_since(existing_names):
    return [obj for obj in bpy.data.objects if obj.name not in existing_names]


def export_glb(objs, filename):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    filepath = os.path.join(OUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )
    print(f"exported {filepath}")


def cleanup(objs):
    for obj in objs:
        bpy.data.objects.remove(obj, do_unlink=True)


# ---------------------------------------------------------------------------
# Garment rack frame (per-product hangers stay procedural in React)
# ---------------------------------------------------------------------------
def build_garment_rack():
    before = {obj.name for obj in bpy.data.objects}

    gold = make_material("rack_gold", CHAMPAGNE_GOLD, metallic=0.9, roughness=0.2)
    shelf_mat = make_material("rack_shelf", (0.68, 0.55, 0.51), metallic=0.05, roughness=0.55)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=2.1, location=(side * 1.35, 0, 1.05))
        pole = bpy.context.active_object
        pole.name = f"rack_pole_{side}"
        pole.data.materials.append(gold)
        shade_smooth(pole)

        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(side * 1.35, 0, 2.12))
        finial = bpy.context.active_object
        finial.name = f"rack_finial_{side}"
        finial.data.materials.append(gold)
        shade_smooth(finial)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.03, location=(side * 1.35, 0, 0.015))
        foot = bpy.context.active_object
        foot.name = f"rack_foot_{side}"
        foot.data.materials.append(gold)
        shade_smooth(foot)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=2.75, location=(0, 0, 2.08), rotation=(0, math.pi / 2, 0))
    bar = bpy.context.active_object
    bar.name = "rack_bar"
    bar.data.materials.append(gold)
    shade_smooth(bar)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.04))
    shelf = bpy.context.active_object
    shelf.name = "rack_shelf"
    shelf.scale = (1.55, 0.36, 0.04)
    shelf.data.materials.append(shelf_mat)
    add_bevel(shelf, width=0.03)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0.32, 0.075))
    trim = bpy.context.active_object
    trim.name = "rack_trim"
    trim.scale = (1.56, 0.015, 0.012)
    trim.data.materials.append(gold)

    objs = new_objects_since(before)
    export_glb(objs, "garment-rack.glb")
    cleanup(objs)


# ---------------------------------------------------------------------------
# Concierge welcome desk (front-of-house fixture)
# ---------------------------------------------------------------------------
def build_concierge_desk():
    before = {obj.name for obj in bpy.data.objects}

    velvet = make_material("desk_velvet", (0.29, 0.16, 0.22), metallic=0.0, roughness=0.6)
    gold = make_material("desk_gold", CHAMPAGNE_GOLD, metallic=0.85, roughness=0.22)
    stone = make_material("desk_stone", MOONLIGHT_CREAM, metallic=0.0, roughness=0.35)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.48))
    body = bpy.context.active_object
    body.name = "desk_body"
    body.scale = (1.2, 0.45, 0.48)
    body.data.materials.append(velvet)
    add_bevel(body, width=0.02)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.03))
    kick = bpy.context.active_object
    kick.name = "desk_kick"
    kick.scale = (1.22, 0.46, 0.03)
    kick.data.materials.append(gold)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 1.0))
    top = bpy.context.active_object
    top.name = "desk_top"
    top.scale = (1.275, 0.5, 0.05)
    top.data.materials.append(stone)
    add_bevel(top, width=0.015)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.955))
    top_trim = bpy.context.active_object
    top_trim.name = "desk_top_trim"
    top_trim.scale = (1.28, 0.505, 0.006)
    top_trim.data.materials.append(gold)

    objs = new_objects_since(before)
    export_glb(objs, "concierge-desk.glb")
    cleanup(objs)


# ---------------------------------------------------------------------------
# Concierge display table (secondary front-of-house fixture)
# ---------------------------------------------------------------------------
def build_concierge_table():
    before = {obj.name for obj in bpy.data.objects}

    blush = make_material("table_blush", (0.72, 0.5, 0.57), metallic=0.0, roughness=0.6)
    gold = make_material("table_gold", CHAMPAGNE_GOLD, metallic=0.85, roughness=0.22)
    stone = make_material("table_stone", ROSE_QUARTZ, metallic=0.0, roughness=0.3)

    for x_side in (-1, 1):
        for y_side in (-1, 1):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.16, location=(x_side * 1.1, y_side * 0.32, 0.08))
            leg = bpy.context.active_object
            leg.name = f"table_leg_{x_side}_{y_side}"
            leg.data.materials.append(gold)
            shade_smooth(leg)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.38))
    body = bpy.context.active_object
    body.name = "table_body"
    body.scale = (1.25, 0.4, 0.22)
    body.data.materials.append(blush)
    add_bevel(body, width=0.02)

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.64))
    top = bpy.context.active_object
    top.name = "table_top"
    top.scale = (1.1, 0.35, 0.04)
    top.data.materials.append(stone)
    add_bevel(top, width=0.012)

    objs = new_objects_since(before)
    export_glb(objs, "concierge-table.glb")
    cleanup(objs)


# ---------------------------------------------------------------------------
# Planter (fluted urn + stylized foliage)
# ---------------------------------------------------------------------------
def build_planter():
    before = {obj.name for obj in bpy.data.objects}

    urn_mat = make_material("planter_urn", (0.84, 0.65, 0.71), metallic=0.1, roughness=0.4)
    gold = make_material("planter_gold", CHAMPAGNE_GOLD, metallic=0.85, roughness=0.22)
    leaf_mat = make_material("planter_leaf", SAGE, metallic=0.0, roughness=0.75)
    accent_mat = make_material("planter_leaf_accent", BLUSH_GLOW, metallic=0.0, roughness=0.6)

    bpy.ops.mesh.primitive_cone_add(radius1=0.38, radius2=0.24, depth=0.5, vertices=20, location=(0, 0, 0.25))
    urn = bpy.context.active_object
    urn.name = "planter_urn"
    urn.data.materials.append(urn_mat)
    shade_smooth(urn)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.31, minor_radius=0.022, location=(0, 0, 0.49), major_segments=20, minor_segments=8)
    rim = bpy.context.active_object
    rim.name = "planter_rim"
    rim.data.materials.append(gold)
    shade_smooth(rim)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.25, minor_radius=0.014, location=(0, 0, 0.1), major_segments=20, minor_segments=8)
    band = bpy.context.active_object
    band.name = "planter_band"
    band.data.materials.append(gold)
    shade_smooth(band)

    leaves = [
        ((-0.16, 0, 0.86), (0, -0.5, -0.42), 0.2, leaf_mat),
        ((0.16, 0.04, 0.9), (0, 0.45, 0.42), 0.2, leaf_mat),
        ((0, -0.08, 1.12), (0.35, 0, 0), 0.22, leaf_mat),
        ((0.05, 0.14, 0.78), (0, -0.3, 1.1), 0.14, accent_mat),
        ((-0.1, -0.12, 0.72), (0, 0.3, -1.3), 0.13, accent_mat),
    ]
    for i, (loc, rot, radius, mat) in enumerate(leaves):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=radius, subdivisions=2, location=loc, rotation=rot)
        leaf = bpy.context.active_object
        leaf.name = f"planter_leaf_{i}"
        leaf.scale = (0.55, 0.9, 1.6)
        leaf.data.materials.append(mat)
        shade_smooth(leaf)

    objs = new_objects_since(before)
    export_glb(objs, "planter.glb")
    cleanup(objs)


# ---------------------------------------------------------------------------
# Halo chandelier centerpiece (Sparkles + label text stay in React)
# ---------------------------------------------------------------------------
def build_halo_chandelier():
    before = {obj.name for obj in bpy.data.objects}

    ring_mat = make_material("halo_ring", (1.0, 0.76, 0.85), metallic=0.75, roughness=0.12, emission=HALO_PINK, emission_strength=2.4)
    inner_mat = make_material("halo_inner", CHAMPAGNE_GOLD, metallic=0.9, roughness=0.15, emission=CHAMPAGNE_GOLD, emission_strength=1.1)
    gem_mat = make_material("halo_gem", (1.0, 0.85, 0.92), metallic=0.4, roughness=0.08, emission=HALO_PINK, emission_strength=1.6)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.72, minor_radius=0.045, major_segments=48, minor_segments=16)
    outer = bpy.context.active_object
    outer.name = "halo_outer_ring"
    outer.data.materials.append(ring_mat)
    shade_smooth(outer)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.5, minor_radius=0.025, major_segments=40, minor_segments=12)
    inner = bpy.context.active_object
    inner.name = "halo_inner_ring"
    inner.data.materials.append(inner_mat)
    shade_smooth(inner)

    gem_count = 8
    for i in range(gem_count):
        angle = (i / gem_count) * math.tau
        x = math.cos(angle) * 0.72
        y = math.sin(angle) * 0.72

        bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=0.18, location=(x, y, -0.1))
        chain = bpy.context.active_object
        chain.name = f"halo_chain_{i}"
        chain.data.materials.append(inner_mat)
        shade_smooth(chain)

        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.045, subdivisions=2, location=(x, y, -0.2))
        gem = bpy.context.active_object
        gem.name = f"halo_gem_{i}"
        gem.scale = (1, 1, 1.6)
        gem.data.materials.append(gem_mat)
        shade_smooth(gem)

    objs = new_objects_since(before)
    export_glb(objs, "halo-chandelier.glb")
    cleanup(objs)


def main():
    clear_scene()
    build_garment_rack()
    clear_scene()
    build_concierge_desk()
    clear_scene()
    build_concierge_table()
    clear_scene()
    build_planter()
    clear_scene()
    build_halo_chandelier()
    print("All Pink Halo fixture assets exported to", OUT_DIR)


if __name__ == "__main__":
    main()
