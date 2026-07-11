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


def make_material(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0, subsurface=0.0, specular=0.5, clearcoat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    output = nodes.get("Material Output")
    if output is None:
        output = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
        bsdf.location = (-200, 0)
        links.new(bsdf.outputs[0], output.inputs[0])
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Subsurface" in bsdf.inputs:
        bsdf.inputs["Subsurface"].default_value = subsurface
    if "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = specular
    if "Clearcoat" in bsdf.inputs:
        bsdf.inputs["Clearcoat"].default_value = clearcoat
    if emission is not None and "Emission" in bsdf.inputs:
        bsdf.inputs["Emission"].default_value = (*emission, 1.0)
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


def add_subdivision(obj, levels=2):
    mod = obj.modifiers.new("Subdivision", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    mod.quality = 4


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
        export_lights=True,
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


def build_room_shell():
    before = {obj.name for obj in bpy.data.objects}

    concrete = make_material("room_concrete", (0.08, 0.07, 0.075), roughness=0.86)
    wall = make_material("room_wall_panel", (0.12, 0.1, 0.115), roughness=0.78)
    ceiling = make_material("room_ceiling", (0.01, 0.01, 0.012), roughness=0.62)
    neon = make_material("room_neon", HALO_PINK, emission=HALO_PINK, emission_strength=5.2)
    trim = make_material("room_trim", (0.11, 0.1, 0.12), metallic=0.18, roughness=0.24)

    width = 8.0
    depth = 10.0
    height = 3.2

    add_cube_obj("shell_floor", (0, 0, 0), (width / 2, depth / 2, 0.04), concrete, bevel=0.02)
    add_cube_obj("shell_ceiling", (0, 0, height), (width / 2, depth / 2, 0.05), ceiling)
    add_cube_obj("shell_back_wall", (0, -depth / 2, height / 2), (width / 2, 0.075, height / 2), wall, bevel=0.03)
    add_cube_obj("shell_left_wall", (-width / 2, 0, height / 2), (0.075, depth / 2, height / 2), wall, bevel=0.03)
    add_cube_obj("shell_right_wall", (width / 2, 0, height / 2), (0.075, depth / 2, height / 2), wall, bevel=0.03)
    add_cube_obj("shell_front_pillar_left", (-1.6, depth / 2 + 0.02, 1.2), (0.14, 0.14, 1.3), wall, bevel=0.03)
    add_cube_obj("shell_front_pillar_right", (1.6, depth / 2 + 0.02, 1.2), (0.14, 0.14, 1.3), wall, bevel=0.03)
    add_cube_obj("shell_front_beam", (0, depth / 2 + 0.02, 2.5), (1.9, 0.08, 0.12), trim, bevel=0.02)
    add_cube_obj("shell_entry_canopy", (0, depth / 2 - 0.15, 2.78), (2.2, 0.06, 0.035), neon, bevel=0.03)

    add_cube_obj("shell_led_back", (0, -depth / 2 + 0.08, height - 0.16), (width / 2 - 0.2, 0.018, 0.018), neon)
    add_cube_obj("shell_led_left", (-width / 2 + 0.08, 0, height - 0.16), (0.018, depth / 2 - 0.2, 0.018), neon)
    add_cube_obj("shell_led_right", (width / 2 - 0.08, 0, height - 0.16), (0.018, depth / 2 - 0.2, 0.018), neon)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-room-shell.glb")
    cleanup(objs)


def build_display_platform():
    before = {obj.name for obj in bpy.data.objects}

    soft_black = make_material("display_platform_black", (0.02, 0.015, 0.018), roughness=0.55)
    neon = make_material("display_platform_neon", HALO_PINK, emission=HALO_PINK, emission_strength=5.0)
    stone = make_material("display_platform_stone", (0.14, 0.12, 0.13), roughness=0.32)

    add_cube_obj("platform_base", (0, 0, 0.09), (0.75, 0.75, 0.09), soft_black, bevel=0.03)
    add_cube_obj("platform_top", (0, 0, 0.24), (0.62, 0.62, 0.04), stone, bevel=0.02)
    add_text_obj("platform_label", "NEW ARRIVAL", (0, 0, 0.34), 0.06, neon, rotation=(math.pi / 2, 0, 0))

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-display-platform.glb")
    cleanup(objs)


def build_shop_counter():
    before = {obj.name for obj in bpy.data.objects}

    dark_wood = make_material("counter_wood", (0.08, 0.05, 0.04), roughness=0.52)
    matte_black = make_material("counter_black", (0.005, 0.005, 0.006), roughness=0.7)
    metal = make_material("counter_metal", (0.12, 0.1, 0.08), metallic=0.85, roughness=0.22)
    neon = make_material("counter_neon", HALO_PINK, emission=HALO_PINK, emission_strength=4.2)

    add_cube_obj("counter_body", (0, -2.55, 0.48), (1.22, 0.42, 0.48), dark_wood, bevel=0.025)
    add_cube_obj("counter_top", (0, -2.55, 1.0), (1.35, 0.5, 0.055), matte_black, bevel=0.014)
    add_cube_obj("counter_kick", (0, -2.11, 0.08), (1.28, 0.03, 0.035), metal)
    add_cube_obj("counter_register", (0.26, -2.63, 1.32), (0.2, 0.025, 0.14), matte_black, bevel=0.008)
    add_text_obj("counter_welcome", "PINK HALO", (-0.58, -2.12, 1.35), 0.12, neon, rotation=(math.pi / 2, 0, 0))

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-counter.glb")
    cleanup(objs)


def build_mirror_wall():
    before = {obj.name for obj in bpy.data.objects}

    glass = make_material("mirror_glass", (0.14, 0.14, 0.15), metallic=1.0, roughness=0.02)
    neon = make_material("mirror_neon", HALO_PINK, emission=HALO_PINK, emission_strength=5.6)
    frame = make_material("mirror_frame", (0.08, 0.08, 0.085), roughness=0.2)

    add_cube_obj("mirror_panel", (3.85, 1.6, 1.28), (0.05, 0.42, 1.02), glass, bevel=0.012)
    add_cube_obj("mirror_frame_left", (3.8, 1.18, 1.28), (0.02, 0.018, 1.02), frame, bevel=0.004)
    add_cube_obj("mirror_frame_right", (3.8, 2.02, 1.28), (0.02, 0.018, 1.02), frame, bevel=0.004)
    add_cube_obj("mirror_frame_top", (3.8, 1.6, 2.3), (0.02, 0.42, 0.018), neon, bevel=0.004)
    add_cube_obj("mirror_frame_bottom", (3.8, 1.6, 0.26), (0.02, 0.42, 0.018), neon, bevel=0.004)
    add_text_obj("mirror_text", "YOU LOOK GOOD IN PINK", (3.78, 1.6, 0.53), 0.08, neon, rotation=(math.pi / 2, 0, math.pi / 2))

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-mirror.glb")
    cleanup(objs)


def build_sale_shelves():
    before = {obj.name for obj in bpy.data.objects}

    metal = make_material("shelf_metal", (0.06, 0.06, 0.07), metallic=0.8, roughness=0.2)
    wood = make_material("shelf_wood", (0.08, 0.05, 0.04), roughness=0.5)
    box_a = make_material("box_a", (0.92, 0.58, 0.68), roughness=0.55)
    box_b = make_material("box_b", (0.94, 0.87, 0.9), roughness=0.45)

    add_cube_obj("sale_shelf_frame_left", (-1.95, -4.65, 1.18), (0.68, 0.12, 1.05), metal, bevel=0.01)
    add_cube_obj("sale_shelf_frame_right", (1.95, -4.65, 1.18), (0.68, 0.12, 1.05), metal, bevel=0.01)
    for level, z_height in enumerate((0.55, 0.95, 1.35, 1.75)):
        add_cube_obj(f"sale_shelf_plank_left_{level}", (-1.95, -4.50, z_height), (0.68, 0.16, 0.025), wood, bevel=0.006)
        add_cube_obj(f"sale_shelf_plank_right_{level}", (1.95, -4.50, z_height), (0.68, 0.16, 0.025), wood, bevel=0.006)
        for side, x in ((-1.95, -1), (1.95, 1)):
            for item in range(3):
                mat = box_a if (level + item) % 2 == 0 else box_b
                add_cube_obj(f"sale_box_{side}_{level}_{item}", (x + item * 0.36, -4.36, z_height + 0.13), (0.09, 0.055, 0.11), mat, bevel=0.006)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-sale-shelves.glb")
    cleanup(objs)


def build_lounge_area():
    before = {obj.name for obj in bpy.data.objects}

    leather = make_material("lounge_leather", (0.01, 0.008, 0.01), roughness=0.4)
    black = make_material("lounge_black", (0.02, 0.02, 0.025), roughness=0.58)
    table = make_material("lounge_table", (0.08, 0.06, 0.05), roughness=0.38)
    rug = make_material("lounge_rug", (0.01, 0.01, 0.015), roughness=0.82)
    plant = make_material("lounge_plant", (0.06, 0.16, 0.09), roughness=0.74)

    add_cube_obj("lounge_rug", (0, 1.45, 0.055), (1.9, 1.45, 0.018), rug, bevel=0.02)
    add_cube_obj("lounge_sofa_base", (-1.75, 3.58, 0.36), (1.55, 0.38, 0.32), leather, bevel=0.04)
    add_cube_obj("lounge_sofa_back", (-1.75, 3.93, 0.74), (1.55, 0.13, 0.5), leather, bevel=0.035)
    for i in range(5):
        add_cube_obj(f"lounge_sofa_channel_{i}", (-2.95 + i * 0.6, 3.28, 0.72), (0.24, 0.12, 0.08), leather, bevel=0.025)

    add_cube_obj("coffee_table_top", (1.55, 3.35, 0.42), (0.78, 0.42, 0.04), black, bevel=0.012)
    add_cube_obj("coffee_table_lower", (1.55, 3.35, 0.18), (0.72, 0.37, 0.025), table, bevel=0.006)
    add_cube_obj("coffee_table_book", (1.2, 3.18, 0.48), (0.18, 0.12, 0.025), black, bevel=0.004)

    add_cylinder_obj("lounge_plant_pot", (-3.55, -4.2, 0.24), 0.22, 0.48, black, vertices=20)
    for j in range(6):
        angle = (j / 6) * math.tau
        add_cube_obj(f"lounge_plant_leaf_{j}", (-3.55 + math.cos(angle) * 0.12, -4.2 + math.sin(angle) * 0.12, 0.75 + 0.08 * (j % 3)), (0.035, 0.12, 0.3), plant, bevel=0.03)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-lounge.glb")
    cleanup(objs)


def build_accessories_display():
    before = {obj.name for obj in bpy.data.objects}

    glass = make_material("accessories_glass", (0.2, 0.32, 0.4), metallic=0.0, roughness=0.1, emission=(0.68, 0.86, 0.99), emission_strength=0.8)
    frame = make_material("accessories_frame", (0.03, 0.03, 0.04), metallic=0.7, roughness=0.22)
    platform = make_material("accessories_platform", (0.08, 0.06, 0.05), roughness=0.45)
    accent = make_material("accessories_accent", HALO_PINK, emission=HALO_PINK, emission_strength=3.1)

    add_cube_obj("accessories_case_base", (2.1, 0.9, 0.18), (0.78, 0.38, 0.06), platform, bevel=0.02)
    add_cube_obj("accessories_case_left", (1.86, 0.9, 0.57), (0.02, 0.38, 0.48), glass)
    add_cube_obj("accessories_case_right", (2.34, 0.9, 0.57), (0.02, 0.38, 0.48), glass)
    add_cube_obj("accessories_case_front", (2.1, 0.52, 0.57), (0.75, 0.02, 0.48), glass)
    add_cube_obj("accessories_case_back", (2.1, 1.28, 0.57), (0.75, 0.02, 0.48), frame)
    add_cube_obj("accessories_case_top", (2.1, 0.9, 0.96), (0.75, 0.38, 0.02), frame)
    add_cube_obj("accessories_display_shelf", (2.1, 0.9, 0.38), (0.72, 0.32, 0.02), platform, bevel=0.01)
    add_cube_obj("accessories_neon_sign", (2.1, 0.9, 0.88), (0.42, 0.02, 0.1), accent, bevel=0.01)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-accessories.glb")
    cleanup(objs)


def build_piggybank():
    before = {obj.name for obj in bpy.data.objects}

    ceramic = make_material("piggybank_ceramic", (0.12, 0.08, 0.1), roughness=0.24)
    pink = make_material("piggybank_pink", (1.0, 0.62, 0.78), roughness=0.28)
    slot = make_material("piggybank_slot", (0.05, 0.03, 0.03), roughness=0.4)
    emblem = make_material("piggybank_emblem", HALO_PINK, emission=HALO_PINK, emission_strength=4.2)
    accent = make_material("piggybank_accent", BLUSH_GLOW, emission=BLUSH_GLOW, emission_strength=2.1)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.42, location=(0, 0, 0.58))
    body = bpy.context.active_object
    body.name = "piggybank_body"
    body.scale = (1.0, 0.95, 0.95)
    body.data.materials.append(ceramic)
    shade_smooth(body)
    add_subdivision(body, levels=2)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(side * 0.23, 0, 0.96))
        ear = bpy.context.active_object
        ear.name = f"piggybank_ear_{side}"
        ear.scale = (1.1, 0.85, 1.1)
        ear.data.materials.append(pink)
        shade_smooth(ear)
        add_subdivision(ear, levels=1)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(side * 0.23, 0.02, 1.03))
        inner = bpy.context.active_object
        inner.name = f"piggybank_ear_inner_{side}"
        inner.data.materials.append(slot)
        shade_smooth(inner)

    snout = add_cylinder_obj("piggybank_snout", (0, 0.18, 0.64), 0.12, 0.16, pink, rotation=(math.pi / 2, 0, 0), vertices=24)
    add_subdivision(snout, levels=1)
    add_cylinder_obj("piggybank_nostril_left", (-0.03, 0.34, 0.64), 0.012, 0.008, slot, rotation=(math.pi / 2, 0, 0), vertices=12)
    add_cylinder_obj("piggybank_nostril_right", (0.03, 0.34, 0.64), 0.012, 0.008, slot, rotation=(math.pi / 2, 0, 0), vertices=12)
    add_cube_obj("piggybank_slot", (0, 0, 1.02), (0.28, 0.04, 0.008), slot)
    add_cylinder_obj("piggybank_coin", (0, -0.08, 0.95), 0.055, 0.008, accent, rotation=(math.pi / 2, 0, 0), vertices=24)
    add_torus_obj("piggybank_tail", (0, 0.48, 0.58), 0.09, 0.017, slot, rotation=(0, 0, 0.7), major_segments=36, minor_segments=10)
    add_cube_obj("piggybank_base_ring", (0, 0, 0.05), (0.42, 0.42, 0.04), slot, bevel=0.02)
    add_text_obj("piggybank_logo", "PINK HALO", (0, -0.24, 0.65), 0.075, emblem, rotation=(math.pi / 2, 0, 0))
    add_halo_logo("piggybank_brand", (0, 0.22, 0.48), 0.16, accent, rotation=(math.pi / 2, 0, 0))
    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(side * 0.12, 0.22, 0.82))
        eye = bpy.context.active_object
        eye.name = f"piggybank_eye_{side}"
        eye.data.materials.append(hair)
        shade_smooth(eye)
        add_subdivision(eye, levels=1)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.02, location=(side * 0.12, 0.24, 0.84))
        pupil = bpy.context.active_object
        pupil.name = f"piggybank_pupil_{side}"
        pupil.data.materials.append(slot)
        shade_smooth(pupil)

    for i, offset in enumerate((-0.24, 0.24)):
        add_cube_obj(f"piggybank_eye_bar_{i}", (offset, 0.17, 0.78), (0.09, 0.015, 0.01), slot, bevel=0.005)
        add_cube_obj(f"piggybank_eye_bar_{i}_2", (offset, 0.17, 0.75), (0.015, 0.09, 0.01), slot, bevel=0.005)

    for i, (x, y) in enumerate(((-0.18, -0.16), (0.18, -0.16), (-0.18, 0.16), (0.18, 0.16))):
        add_cylinder_obj(f"piggybank_foot_{i}", (x, y, 0.15), 0.065, 0.14, ceramic, vertices=18)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-piggybank.glb")
    cleanup(objs)


def build_lighting_fixtures():
    before = {obj.name for obj in bpy.data.objects}

    metal = make_material("lighting_metal", (0.1, 0.1, 0.11), metallic=0.85, roughness=0.18)
    light_glow = make_material("lighting_glow", HALO_PINK, emission=HALO_PINK, emission_strength=6.2)

    add_cylinder_obj("fixture_pendant_cord_1", (-2.3, -2.15, 2.3), 0.01, 0.7, metal)
    add_cylinder_obj("fixture_pendant_shade_1", (-2.3, -2.15, 1.1), 0.22, 0.16, metal)
    add_cube_obj("fixture_pendant_glow_1", (-2.3, -2.15, 0.86), (0.18, 0.18, 0.05), light_glow, bevel=0.04)

    add_cylinder_obj("fixture_pendant_cord_2", (0, -2.15, 2.3), 0.01, 0.7, metal)
    add_cylinder_obj("fixture_pendant_shade_2", (0, -2.15, 1.1), 0.22, 0.16, metal)
    add_cube_obj("fixture_pendant_glow_2", (0, -2.15, 0.86), (0.18, 0.18, 0.05), light_glow, bevel=0.04)

    add_cylinder_obj("fixture_pendant_cord_3", (2.3, -2.15, 2.3), 0.01, 0.7, metal)
    add_cylinder_obj("fixture_pendant_shade_3", (2.3, -2.15, 1.1), 0.22, 0.16, metal)
    add_cube_obj("fixture_pendant_glow_3", (2.3, -2.15, 0.86), (0.18, 0.18, 0.05), light_glow, bevel=0.04)

    add_cylinder_obj("fixture_ring_mount", (0, 0, 2.9), 0.045, 0.1, metal)
    add_cube_obj("fixture_ring_glow", (0, 0, 2.8), (0.72, 0.72, 0.02), light_glow, bevel=0.04)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-lighting.glb")
    cleanup(objs)


def build_fx_cluster():
    before = {obj.name for obj in bpy.data.objects}

    glow = make_material("fx_glow", HALO_PINK, emission=HALO_PINK, emission_strength=5.5)
    ring = make_material("fx_ring", (1.0, 0.82, 0.88), roughness=0.18)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.78, minor_radius=0.012, major_segments=64, minor_segments=16)
    halo = bpy.context.active_object
    halo.name = "fx_halo_ring"
    halo.data.materials.append(glow)
    shade_smooth(halo)

    add_star_mesh("fx_star_1", (0.36, 0.36, 1.8), 0.08, glow)
    add_star_mesh("fx_star_2", (-0.28, -0.22, 1.92), 0.05, glow)
    add_star_mesh("fx_star_3", (0.22, -0.34, 1.7), 0.06, glow)
    add_cube_obj("fx_pulse_cube", (0, 0, 1.22), (0.08, 0.08, 0.08), ring, bevel=0.04)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-fx.glb")
    cleanup(objs)


def add_cube_obj(name, location, scale, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    if bevel:
        add_bevel(obj, width=bevel)
    return obj


def add_cylinder_obj(name, location, radius, depth, mat, rotation=(0, 0, 0), vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=vertices, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    shade_smooth(obj)
    return obj


def add_torus_obj(name, location, major_radius, minor_radius, mat, rotation=(0, 0, 0), major_segments=48, minor_segments=16):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    shade_smooth(obj)
    add_subdivision(obj, levels=1)
    return obj


def add_text_obj(name, body, location, size, mat, rotation=(math.pi / 2, 0, 0), align="CENTER"):
    bpy.ops.object.text_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.body = body
    obj.data.align_x = align
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.012
    obj.data.materials.append(mat)
    obj.scale.x = -1
    return obj


def add_star_mesh(name, location, radius, mat, rotation=(math.pi / 2, 0, 0)):
    verts = [(0, 0, 0)]
    points = 16
    for i in range(points):
        angle = (i / points) * math.tau
        point_radius = radius if i % 2 == 0 else radius * 0.28
        verts.append((math.cos(angle) * point_radius, math.sin(angle) * point_radius, 0))
    faces = []
    for i in range(1, points + 1):
        faces.append((0, i, 1 if i == points else i + 1))
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    return obj


def add_halo_logo(prefix, location, radius, mat, rotation=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius,
        minor_radius=radius * 0.035,
        major_segments=64,
        minor_segments=8,
        location=location,
        rotation=rotation,
    )
    ring = bpy.context.active_object
    ring.name = f"{prefix}_halo_ring"
    ring.scale = (1.7, 0.58, 1)
    ring.data.materials.append(mat)
    shade_smooth(ring)

    star = add_star_mesh(f"{prefix}_halo_star", location, radius * 0.8, mat, rotation=rotation)
    return [ring, star]


def build_shop_room():
    before = {obj.name for obj in bpy.data.objects}

    concrete = make_material("shop_rough_concrete", (0.08, 0.07, 0.075), roughness=0.88)
    concrete_panel = make_material("shop_concrete_panel", (0.13, 0.11, 0.12), roughness=0.82)
    polished = make_material("shop_polished_concrete", (0.12, 0.09, 0.085), metallic=0.12, roughness=0.28)
    matte_black = make_material("shop_matte_black", (0.005, 0.005, 0.006), roughness=0.72)
    soft_black = make_material("shop_soft_black", (0.02, 0.015, 0.018), roughness=0.58)
    dark_wood = make_material("shop_dark_wood", (0.07, 0.045, 0.035), roughness=0.5)
    leather = make_material("shop_black_leather", (0.015, 0.012, 0.013), roughness=0.35)
    metal = make_material("shop_blackened_metal", (0.01, 0.01, 0.011), metallic=0.7, roughness=0.25)
    warm_light = make_material("shop_warm_light", (1.0, 0.82, 0.62), emission=(1.0, 0.72, 0.42), emission_strength=2.8)
    neon = make_material("shop_neon_pink", (1.0, 0.32, 0.64), emission=HALO_PINK, emission_strength=8.0)
    neon_soft = make_material("shop_soft_neon_pink", (1.0, 0.74, 0.86), emission=(1.0, 0.68, 0.82), emission_strength=3.2)
    blush = make_material("shop_blush_fabric", (0.94, 0.55, 0.68), roughness=0.68)
    white = make_material("shop_soft_white", (0.92, 0.86, 0.88), roughness=0.6)
    leaf = make_material("shop_deep_leaf", (0.06, 0.18, 0.09), roughness=0.78)

    width = 8.0
    depth = 10.0
    height = 3.2

    add_cube_obj("room_floor_polished_concrete", (0, 0, 0), (width / 2, depth / 2, 0.04), polished)
    add_cube_obj("room_ceiling_dark", (0, 0, height), (width / 2, depth / 2, 0.05), matte_black)
    add_cube_obj("room_back_wall_concrete", (0, -depth / 2, height / 2), (width / 2, 0.07, height / 2), concrete)
    add_cube_obj("room_left_wall_concrete", (-width / 2, 0, height / 2), (0.07, depth / 2, height / 2), concrete)
    add_cube_obj("room_right_wall_concrete", (width / 2, 0, height / 2), (0.07, depth / 2, height / 2), concrete)

    # Front wall is split into glass/open entry panels so the player spawns into the room.
    add_cube_obj("front_left_glass_panel", (-2.45, depth / 2, 1.65), (1.55, 0.055, 1.65), concrete_panel)
    add_cube_obj("front_right_glass_panel", (2.45, depth / 2, 1.65), (1.55, 0.055, 1.65), concrete_panel)

    # Entry arch and welcome canopy to replace the old shop entrance with a more refined arrival sequence.
    add_cube_obj("entrance_left_pillar", (-1.6, depth / 2 + 0.02, 1.2), (0.14, 0.14, 1.3), polished, bevel=0.03)
    add_cube_obj("entrance_right_pillar", (1.6, depth / 2 + 0.02, 1.2), (0.14, 0.14, 1.3), polished, bevel=0.03)
    add_cube_obj("entrance_top_beam", (0, depth / 2 + 0.02, 2.5), (1.9, 0.08, 0.12), soft_black, bevel=0.02)
    add_cube_obj("entrance_canopy", (0, depth / 2 - 0.14, 2.78), (2.2, 0.06, 0.035), neon_soft, bevel=0.03)
    add_text_obj("entrance_sign_text", "ENTER\nPINK HALO", (0, depth / 2 - 0.15, 2.85), 0.08, neon, rotation=(math.pi / 2, 0, 0))

    # Central display plinth gives the room a focal object and replaces the old center floor layout.
    add_cube_obj("center_plinth_base", (0, 0, 0.09), (0.75, 0.75, 0.09), soft_black, bevel=0.03)
    add_cube_obj("center_plinth_top", (0, 0, 0.24), (0.62, 0.62, 0.04), polished, bevel=0.02)
    add_text_obj("center_plinth_label", "NEW ARRIVAL", (0, 0, 0.34), 0.06, neon_soft, rotation=(math.pi / 2, 0, 0))

    for offset in (-0.7, 0.7):
        add_cube_obj(f"floor_stripe_{offset}", (offset, -0.45, 0.025), (0.08, 5.5, 0.01), soft_black, bevel=0.005)

    for x in (-2, 0, 2):
        add_cube_obj(f"back_wall_panel_{x}", (x, -depth / 2 + 0.015, 1.6), (0.9, 0.025, 1.42), concrete_panel, bevel=0.006)
    for z in (-3.2, -1.1, 1.1, 3.2):
        add_cube_obj(f"left_wall_panel_{z}", (-width / 2 + 0.015, z, 1.6), (0.025, 0.78, 1.42), concrete_panel, bevel=0.006)
        add_cube_obj(f"right_wall_panel_{z}", (width / 2 - 0.015, z, 1.6), (0.025, 0.78, 1.42), concrete_panel, bevel=0.006)

    # Pink LED strips trace the ceiling edges.
    add_cube_obj("led_strip_back", (0, -depth / 2 + 0.08, height - 0.16), (width / 2 - 0.2, 0.018, 0.018), neon)
    add_cube_obj("led_strip_left", (-width / 2 + 0.08, 0, height - 0.16), (0.018, depth / 2 - 0.2, 0.018), neon)
    add_cube_obj("led_strip_right", (width / 2 - 0.08, 0, height - 0.16), (0.018, depth / 2 - 0.2, 0.018), neon)

    # Pendant lights and warm pools over the desk and lounge.
    for i, x in enumerate((-2.3, 0, 2.3)):
        add_cylinder_obj(f"pendant_cord_{i}", (x, -2.15, height - 0.35), 0.01, 0.7, metal)
        add_cylinder_obj(f"pendant_shade_{i}", (x, -2.15, height - 0.76), 0.22, 0.16, matte_black)
        add_cylinder_obj(f"pendant_light_{i}", (x, -2.15, height - 0.86), 0.16, 0.02, warm_light)
        bpy.ops.object.light_add(type="POINT", location=(x, -2.15, height - 0.98))
        light = bpy.context.active_object
        light.name = f"pendant_point_light_{i}"
        light.data.color = (1.0, 0.78, 0.62)
        light.data.energy = 95
        light.data.shadow_soft_size = 2.0

    # Shop counter, branded front emblem, register, and product accents.
    add_cube_obj("shop_counter_body", (0, -2.55, 0.48), (1.22, 0.42, 0.48), dark_wood, bevel=0.025)
    add_cube_obj("shop_counter_top", (0, -2.55, 1.0), (1.35, 0.5, 0.055), soft_black, bevel=0.014)
    add_cube_obj("shop_counter_kick", (0, -2.11, 0.08), (1.28, 0.03, 0.035), metal)
    add_halo_logo("counter_front", (0, -2.11, 0.52), 0.24, neon, rotation=(math.pi / 2, 0, 0))
    add_cube_obj("register_screen", (0.26, -2.63, 1.32), (0.2, 0.025, 0.14), matte_black, bevel=0.008)
    add_cube_obj("register_base", (0.26, -2.55, 1.08), (0.16, 0.13, 0.04), metal, bevel=0.006)
    add_text_obj("welcome_sign_text", "WELCOME\nTO\nPINK HALO", (-0.58, -2.12, 1.35), 0.12, neon_soft)

    # Back neon mark and wordmark.
    add_halo_logo("back_wall", (0, -4.91, 2.22), 0.42, neon, rotation=(math.pi / 2, 0, 0))
    add_text_obj("left_wall_pink_halo_sign", "PINK\nHALO", (-3.86, -2.35, 2.08), 0.34, neon, rotation=(math.pi / 2, 0, -math.pi / 2))

    # Shelving units with boxed products.
    for side, x in (("left", -1.95), ("right", 1.95)):
        add_cube_obj(f"{side}_shelf_frame", (x, -4.65, 1.18), (0.68, 0.12, 1.05), metal, bevel=0.01)
        for level, z_height in enumerate((0.55, 0.95, 1.35, 1.75)):
            add_cube_obj(f"{side}_shelf_plank_{level}", (x, -4.50, z_height), (0.68, 0.16, 0.025), dark_wood, bevel=0.006)
            for item in range(3):
                color_mat = blush if (item + level) % 2 == 0 else white
                add_cube_obj(f"{side}_boxed_product_{level}_{item}", (x - 0.36 + item * 0.36, -4.36, z_height + 0.13), (0.09, 0.055, 0.11), color_mat, bevel=0.006)

    # Clothing rack on the left.
    add_cylinder_obj("rack_left_post", (-3.15, -0.85, 0.85), 0.025, 1.7, metal)
    add_cylinder_obj("rack_right_post", (-1.35, -0.85, 0.85), 0.025, 1.7, metal)
    add_cylinder_obj("rack_bar", (-2.25, -0.85, 1.66), 0.025, 1.8, metal, rotation=(0, math.pi / 2, 0))
    add_cube_obj("rack_base", (-2.25, -0.85, 0.08), (1.0, 0.27, 0.035), metal, bevel=0.008)
    shirt_mats = [matte_black, blush, white, soft_black, neon_soft]
    for i in range(10):
        x = -3.02 + i * 0.17
        add_cube_obj(f"hanging_garment_{i}", (x, -0.82, 1.12), (0.065, 0.035, 0.38), shirt_mats[i % len(shirt_mats)], bevel=0.01)
        add_cylinder_obj(f"hanger_hook_{i}", (x, -0.84, 1.58), 0.012, 0.22, metal, rotation=(math.pi / 2, 0, 0), vertices=12)

    # Right-side exit door, neon mirror, and poster.
    add_cube_obj("exit_door", (3.91, -1.5, 1.05), (0.055, 0.52, 1.05), matte_black, bevel=0.014)
    add_cube_obj("exit_sign_box", (3.88, -1.5, 2.35), (0.045, 0.34, 0.12), soft_black, bevel=0.006)
    add_text_obj("exit_sign_text", "EXIT", (3.83, -1.5, 2.36), 0.16, neon_soft, rotation=(math.pi / 2, 0, math.pi / 2))
    add_cube_obj("neon_mirror_back", (3.86, 1.6, 1.28), (0.045, 0.42, 1.02), soft_black, bevel=0.035)
    add_cube_obj("neon_mirror_left_edge", (3.8, 1.18, 1.28), (0.02, 0.018, 1.02), neon, bevel=0.004)
    add_cube_obj("neon_mirror_right_edge", (3.8, 2.02, 1.28), (0.02, 0.018, 1.02), neon, bevel=0.004)
    add_cube_obj("neon_mirror_top_edge", (3.8, 1.6, 2.3), (0.02, 0.42, 0.018), neon, bevel=0.004)
    add_cube_obj("neon_mirror_bottom_edge", (3.8, 1.6, 0.26), (0.02, 0.42, 0.018), neon, bevel=0.004)
    add_text_obj("mirror_phrase", "YOU LOOK\nGOOD IN PINK", (3.78, 1.6, 0.53), 0.08, neon_soft, rotation=(math.pi / 2, 0, math.pi / 2))
    add_cube_obj("wall_poster", (3.91, 0.1, 1.65), (0.035, 0.3, 0.42), soft_black, bevel=0.006)
    add_halo_logo("poster", (3.86, 0.1, 1.65), 0.14, neon, rotation=(math.pi / 2, 0, math.pi / 2))

    # Lounge foreground: sofa, coffee table, rug, and branded floor mark.
    add_cube_obj("black_rug", (0, 1.45, 0.055), (1.9, 1.45, 0.018), soft_black, bevel=0.02)
    add_halo_logo("rug", (0, 1.45, 0.085), 0.34, neon, rotation=(0, 0, 0))
    add_cube_obj("lounge_sofa_base", (-1.75, 3.58, 0.36), (1.55, 0.38, 0.32), leather, bevel=0.04)
    add_cube_obj("lounge_sofa_back", (-1.75, 3.93, 0.74), (1.55, 0.13, 0.5), leather, bevel=0.035)
    for i in range(5):
        add_cube_obj(f"sofa_channel_{i}", (-2.95 + i * 0.6, 3.28, 0.72), (0.24, 0.12, 0.08), leather, bevel=0.025)
    add_cube_obj("coffee_table_top", (1.55, 3.35, 0.42), (0.78, 0.42, 0.04), soft_black, bevel=0.012)
    add_cube_obj("coffee_table_lower", (1.55, 3.35, 0.18), (0.72, 0.37, 0.025), metal, bevel=0.006)
    add_cube_obj("coffee_table_book", (1.2, 3.18, 0.48), (0.18, 0.12, 0.025), blush, bevel=0.004)
    add_text_obj("coffee_table_book_label", "PINK\nHALO", (1.2, 3.18, 0.512), 0.05, neon_soft, rotation=(0, 0, 0))

    # Plants in matte black pots.
    plant_locations = [(-3.55, -4.2), (3.45, -4.0), (-3.55, 2.25), (3.4, 3.15), (0.8, 3.55)]
    for i, (x, y) in enumerate(plant_locations):
        add_cylinder_obj(f"plant_pot_{i}", (x, y, 0.24), 0.22, 0.48, matte_black, vertices=20)
        for j in range(7):
            angle = (j / 7) * math.tau
            add_cube_obj(
                f"plant_leaf_{i}_{j}",
                (x + math.cos(angle) * 0.12, y + math.sin(angle) * 0.12, 0.75 + 0.08 * (j % 3)),
                (0.035, 0.12, 0.3),
                leaf,
                bevel=0.03,
            ).rotation_euler = (0.42 + 0.12 * j, 0.1, angle)

    # Subtle central pink light volumes for bloom in Three/Blender renders.
    bpy.ops.object.light_add(type="AREA", location=(0, -2.3, 2.5))
    area = bpy.context.active_object
    area.name = "pink_counter_area_light"
    area.data.color = HALO_PINK
    area.data.energy = 280
    area.data.size = 4.0

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-shop-room.glb")
    cleanup(objs)


def build_shopkeeper():
    before = {obj.name for obj in bpy.data.objects}

    skin = make_material("keeper_light_tan_skin", (0.66, 0.46, 0.38), roughness=0.5)
    blush = make_material("keeper_blush", (0.85, 0.35, 0.45), roughness=0.45)
    hair = make_material("keeper_dark_hair", (0.005, 0.004, 0.004), roughness=0.35)
    hair_pink = make_material("keeper_pink_hair_accent", (1.0, 0.18, 0.46), emission=HALO_PINK, emission_strength=0.7, roughness=0.45)
    sweatshirt = make_material("keeper_black_sweatshirt", (0.006, 0.006, 0.007), roughness=0.72)
    pants = make_material("keeper_black_cargo_pants", (0.01, 0.01, 0.012), roughness=0.68)
    shoe_black = make_material("keeper_black_sneaker", (0.015, 0.014, 0.014), roughness=0.52)
    shoe_white = make_material("keeper_white_sneaker_panel", (0.82, 0.78, 0.76), roughness=0.4)
    metal = make_material("keeper_silver_accessories", (0.72, 0.68, 0.64), metallic=0.85, roughness=0.22)
    neon = make_material("keeper_neon_logo", (1.0, 0.30, 0.62), emission=HALO_PINK, emission_strength=4.0)

    # Body proportions: 1 Blender unit = 1 meter, total height roughly 1.68m.
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(0, 0, 1.42))
    head = bpy.context.active_object
    head.name = "shopkeeper_head"
    head.scale = (0.82, 0.72, 1.05)
    head.data.materials.append(skin)
    shade_smooth(head)
    add_subdivision(head, levels=2)

    neck = add_cylinder_obj("shopkeeper_neck", (0, 0, 1.18), 0.075, 0.15, skin, vertices=16)
    neck.rotation_euler = (0, 0, 0)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, location=(0, 0, 0.93))
    torso = bpy.context.active_object
    torso.name = "shopkeeper_oversized_sweatshirt"
    torso.scale = (0.92, 0.62, 1.15)
    torso.data.materials.append(sweatshirt)
    shade_smooth(torso)

    add_cube_obj("shopkeeper_shoulder_left", (-0.33, 0.08, 0.98), (0.18, 0.22, 0.08), sweatshirt, bevel=0.05)
    add_cube_obj("shopkeeper_shoulder_right", (0.33, 0.08, 0.98), (0.18, 0.22, 0.08), sweatshirt, bevel=0.05)
    add_cube_obj("shopkeeper_hood", (0, -0.05, 1.24), (0.52, 0.24, 0.14), sweatshirt, bevel=0.05)
    add_cube_obj("shopkeeper_hood_trim", (0, -0.12, 1.24), (0.48, 0.12, 0.02), metal)
    add_cube_obj("shopkeeper_sweatshirt_hem", (0, 0, 0.58), (0.36, 0.24, 0.045), sweatshirt, bevel=0.025)

    add_text_obj("shopkeeper_chest_logo", "PINK\nHALO", (0, -0.355, 0.98), 0.12, neon, rotation=(math.pi / 2, 0, 0))
    add_halo_logo("shopkeeper_chest", (0, -0.36, 0.77), 0.075, neon, rotation=(math.pi / 2, 0, 0))
    add_halo_logo("shopkeeper_back", (0, 0.42, 0.98), 0.085, neon, rotation=(math.pi / 2, 0, 0))

    for side in (-1, 1):
        x = side * 0.13
        add_cube_obj(f"shopkeeper_pant_leg_{side}", (x, 0, 0.36), (0.11, 0.09, 0.35), pants, bevel=0.05)
        add_cube_obj(f"shopkeeper_cargo_pocket_{side}", (x + side * 0.07, -0.055, 0.42), (0.055, 0.025, 0.09), pants, bevel=0.012)
        add_cube_obj(f"shopkeeper_knee_pad_{side}", (x, -0.02, 0.28), (0.07, 0.04, 0.08), pants, bevel=0.02)
        add_cube_obj(f"shopkeeper_sneaker_{side}", (x, -0.035, 0.05), (0.15, 0.25, 0.055), shoe_black, bevel=0.035)
        add_cube_obj(f"shopkeeper_sneaker_panel_{side}", (x, -0.16, 0.075), (0.11, 0.045, 0.025), shoe_white, bevel=0.012)
        add_cube_obj(f"shopkeeper_shoe_sole_{side}", (x, -0.035, 0.01), (0.16, 0.27, 0.02), metal, bevel=0.025)

    add_cube_obj("shopkeeper_belt", (0, 0, 0.32), (0.35, 0.04, 0.05), metal, bevel=0.02)
    add_cube_obj("shopkeeper_buckle", (0, 0.045, 0.34), (0.08, 0.02, 0.045), metal, bevel=0.012)

    add_cylinder_obj("shopkeeper_wallet_chain_a", (0.23, -0.12, 0.56), 0.008, 0.42, metal, rotation=(0.55, 0.2, 0.1), vertices=8)
    add_cylinder_obj("shopkeeper_wallet_chain_b", (0.27, -0.12, 0.38), 0.008, 0.34, metal, rotation=(-0.25, 0.12, 0.05), vertices=8)
    for i in range(5):
        angle = math.pi * 0.12 + i * 0.14
        add_torus_obj(
            f"shopkeeper_necklace_link_{i}",
            (math.sin(angle) * 0.08, -0.15 + i * -0.006, 1.02 - i * 0.015),
            0.04,
            0.007,
            metal,
            rotation=(math.pi / 2, 0, 0),
            major_segments=24,
            minor_segments=10,
        )
    add_cylinder_obj("shopkeeper_left_thigh", (-0.13, 0, 0.58), 0.095, 0.34, pants, rotation=(0.05, 0, 0), vertices=16)
    add_cylinder_obj("shopkeeper_right_thigh", (0.13, 0, 0.58), 0.095, 0.34, pants, rotation=(0.05, 0, 0), vertices=16)
    add_cylinder_obj("shopkeeper_left_calf", (-0.13, 0, 0.22), 0.08, 0.28, pants, rotation=(-0.05, 0, 0), vertices=16)
    add_cylinder_obj("shopkeeper_right_calf", (0.13, 0, 0.22), 0.08, 0.28, pants, rotation=(-0.05, 0, 0), vertices=16)

    add_cylinder_obj("shopkeeper_left_upper_arm", (-0.43, -0.02, 0.95), 0.055, 0.48, sweatshirt, rotation=(0.25, 0.15, -0.55), vertices=16)
    add_cylinder_obj("shopkeeper_left_forearm", (-0.55, -0.06, 0.66), 0.045, 0.42, sweatshirt, rotation=(0.1, 0.0, -0.1), vertices=16)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, location=(-0.56, -0.08, 0.43))
    hand = bpy.context.active_object
    hand.name = "shopkeeper_left_hand"
    hand.scale = (0.9, 0.65, 1.0)
    hand.data.materials.append(skin)
    shade_smooth(hand)

    add_cylinder_obj("shopkeeper_right_upper_arm", (0.42, -0.02, 1.0), 0.055, 0.45, sweatshirt, rotation=(0.25, 0.05, 0.9), vertices=16)
    add_cylinder_obj("shopkeeper_right_forearm_wave", (0.64, -0.08, 1.25), 0.043, 0.4, sweatshirt, rotation=(0.2, 0.0, 0.35), vertices=16)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(0.73, -0.12, 1.45))
    wave_hand = bpy.context.active_object
    wave_hand.name = "shopkeeper_wave_hand"
    wave_hand.scale = (0.8, 0.5, 1.1)
    wave_hand.data.materials.append(skin)
    shade_smooth(wave_hand)
    for i in range(4):
        add_cylinder_obj(f"shopkeeper_wave_finger_{i}", (0.69 + i * 0.025, -0.14, 1.53), 0.01, 0.14, skin, rotation=(0.3, 0.05, 0.0), vertices=8)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, location=(side * 0.08, -0.19, 1.46))
        eye = bpy.context.active_object
        eye.name = f"shopkeeper_eye_{side}"
        eye.scale = (1.35, 0.38, 0.72)
        eye.data.materials.append(hair)
        shade_smooth(eye)
        add_cube_obj(f"shopkeeper_brow_{side}", (side * 0.08, -0.205, 1.52), (0.055, 0.01, 0.008), hair, bevel=0.004).rotation_euler.z = -side * 0.15
        add_cylinder_obj(f"shopkeeper_hoop_earring_{side}", (side * 0.2, -0.02, 1.36), 0.035, 0.006, metal, rotation=(math.pi / 2, 0, 0), vertices=18)

    add_cube_obj("shopkeeper_nose", (0, -0.218, 1.4), (0.025, 0.018, 0.04), skin, bevel=0.015)
    add_cube_obj("shopkeeper_lips", (0, -0.215, 1.32), (0.07, 0.012, 0.012), blush, bevel=0.008)

    for i, x in enumerate((-0.14, -0.07, 0.02, 0.09)):
        add_cylinder_obj(f"shopkeeper_bang_{i}", (x, -0.19, 1.58 - i * 0.025), 0.02, 0.28, hair, rotation=(0.45, 0.05, -0.18 + i * 0.08), vertices=10)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0.04, 0.24, 1.66))
    bun = bpy.context.active_object
    bun.name = "shopkeeper_messy_bun"
    bun.scale = (1.1, 0.85, 0.8)
    bun.data.materials.append(hair)
    shade_smooth(bun)

    for i, angle in enumerate((-0.9, -0.35, 0.4, 0.95)):
        mat = hair_pink if i in (1, 3) else hair
        add_cylinder_obj(
            f"shopkeeper_loose_hair_strand_{i}",
            (math.sin(angle) * 0.18, -0.12, 1.42 - i * 0.035),
            0.012,
            0.42,
            mat,
            rotation=(0.45, 0.2, angle),
            vertices=8,
        )

    bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.008, location=(0, -0.01, 1.19), rotation=(math.pi / 2, 0, 0), major_segments=32, minor_segments=8)
    choker = bpy.context.active_object
    choker.name = "shopkeeper_choker"
    choker.scale = (1.25, 0.45, 1)
    choker.data.materials.append(metal)
    shade_smooth(choker)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.006, location=(0, -0.2, 1.05), rotation=(math.pi / 2, 0, 0), major_segments=36, minor_segments=6)
    necklace = bpy.context.active_object
    necklace.name = "shopkeeper_layered_necklace"
    necklace.scale = (1.0, 0.32, 0.6)
    necklace.data.materials.append(metal)
    shade_smooth(necklace)

    objs = new_objects_since(before)
    export_glb(objs, "pink-halo-shopkeeper.glb")
    cleanup(objs)


def main():
    clear_scene()
    build_shop_room()
    clear_scene()
    build_shopkeeper()
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
    clear_scene()
    build_room_shell()
    clear_scene()
    build_display_platform()
    clear_scene()
    build_shop_counter()
    clear_scene()
    build_mirror_wall()
    clear_scene()
    build_sale_shelves()
    clear_scene()
    build_lounge_area()
    clear_scene()
    build_accessories_display()
    clear_scene()
    build_piggybank()
    clear_scene()
    build_lighting_fixtures()
    clear_scene()
    build_fx_cluster()
    print("All Pink Halo fixture assets exported to", OUT_DIR)


if __name__ == "__main__":
    main()
