# Builds one Blender scene from an exported model, renders it with Cycles, saves the .blend and a web-ready GLB.
import bpy, math, sys, os, time
from mathutils import Vector
name = sys.argv[1]; samples = int(sys.argv[2]) if len(sys.argv) > 2 else 48
ORDER = ['nursery','kg','class1','class2','beyond']; idx = ORDER.index(name)
RIB = [(0.953,0.776,0.184),(0.941,0.471,0.361),(0.435,0.796,0.902),(0.722,0.573,0.902),(0.886,0.690,0.251)][idx]
srgb = lambda c: tuple(((v/12.92) if v <= 0.04045 else ((v+0.055)/1.055)**2.4) for v in c)
t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.name = f'Clarus Junior - {name}'

def into(coll_name, objs):
    c = bpy.data.collections.new(coll_name); sc.collection.children.link(c)
    for o in objs:
        for uc in list(o.users_collection): uc.objects.unlink(o)
        c.objects.link(o)
    return c

# 1. the scene itself
bpy.ops.import_scene.gltf(filepath=f'glb/{name}.glb')
scene_objs = list(bpy.context.selected_objects)
into('Scene', scene_objs)

# 2. web export of just the scene (this is what the website loads)
bpy.ops.object.select_all(action='DESELECT')
for o in scene_objs: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=f'web/{name}.glb', export_format='GLB', use_selection=True)

# 3. mascot on the path
zpath = lambda x: 1.45 + 0.26*math.sin(((x + idx*14) + 12)/3.2*1.35)
bpy.ops.import_scene.gltf(filepath='glb/mascot.glb')
m_objs = list(bpy.context.selected_objects); into('Mascot', m_objs)
for o in m_objs:
    if o.parent is None:
        o.rotation_mode = 'XYZ'; o.location = (-2.1, -(zpath(-2.1)-.12), 0); o.rotation_euler = (0,0,.55); o.scale = (1.1,1.1,1.1)

# 4. ribbon path
def strip(nm, half, z, col, emit):
    xs = [(-10 + i*.2) for i in range(101)]; verts = []; faces = []
    for x in xs:
        yc = -zpath(x); verts += [(x, yc-half, z), (x, yc+half, z)]
    for i in range(len(xs)-1): faces.append((2*i, 2*i+2, 2*i+3, 2*i+1))
    me = bpy.data.meshes.new(nm); me.from_pydata(verts, [], faces); me.update()
    ob = bpy.data.objects.new(nm, me)
    mat = bpy.data.materials.new(nm); mat.use_nodes = True; b = mat.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb(col),1); b.inputs['Roughness'].default_value = .7
    b.inputs['Emission Color'].default_value = (*srgb(col),1); b.inputs['Emission Strength'].default_value = emit
    me.materials.append(mat); return ob
light = tuple(c + (1-c)*.5 for c in RIB)
into('Path', [strip('Path', .3, .004, RIB, .03), strip('Path centre', .1, .008, light, .05)])

# 5. floor that only catches shadows, so the page colour shows through
bpy.ops.mesh.primitive_plane_add(size=120, location=(0,0,0)); floor = bpy.context.active_object; floor.name = 'Shadow floor'; floor.is_shadow_catcher = True
into('Stage', [floor])

# 6. lights
def aim(o, target): o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (Vector(target) - o.location).to_track_quat('-Z','Y')
key = bpy.data.objects.new('Key sun', bpy.data.lights.new('Key sun','SUN')); key.data.energy = 2.0; key.data.angle = math.radians(16); key.data.color = (1,.955,.89); key.location = (-5,-6,8); aim(key,(0,0,0))
fill = bpy.data.objects.new('Fill', bpy.data.lights.new('Fill','AREA')); fill.data.energy = 130; fill.data.size = 6; fill.data.color = (.9,.93,1); fill.location = (6,-6,4); aim(fill,(0,0,.8))
glow = bpy.data.objects.new('Mascot glow', bpy.data.lights.new('Mascot glow','POINT')); glow.data.energy = 14; glow.data.color = (1,.78,.3); glow.data.shadow_soft_size = .25; glow.location = (-2.05,-(zpath(-2.1)+.4),.42)
lights = [key, fill, glow]
if name == 'beyond':
    a = bpy.data.objects.new('Arch glow', bpy.data.lights.new('Arch glow','POINT')); a.data.energy = 420; a.data.color = (1,.82,.48); a.data.shadow_soft_size = .5; a.location = (0,3.4,2.0); lights.append(a)
into('Lights', lights)
w = bpy.data.worlds.new('Studio'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (*srgb((.96,.94,.91)),1); bg.inputs[1].default_value = .62

# 7. camera, matching the website camera
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = 24; cam.data.lens = 24/(2*math.tan(math.radians(27)/2))
cam.location = (.45,-8.0,3.0); aim(cam,(.12,0,1.08)); into('Camera', [cam]); sc.camera = cam

# 8. softer, more lifelike skin
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    b = mat.node_tree.nodes.get('Principled BSDF')
    if not b: continue
    r,g,bl,_ = b.inputs['Base Color'].default_value
    if not b.inputs['Base Color'].is_linked and r > .6 and .35 < g < .7 and .2 < bl < .55 and r-g > .1 and g-bl > .05:
        mat.name = 'Skin'; b.inputs['Subsurface Weight'].default_value = .35; b.inputs['Subsurface Radius'].default_value = (.08,.04,.03); b.inputs['Subsurface Scale'].default_value = .05

for mat in bpy.data.materials:
    b = mat.node_tree.nodes.get('Principled BSDF') if mat.node_tree else None
    if b and not mat.name.startswith('Path') and b.inputs['Emission Strength'].default_value > 0: b.inputs['Emission Strength'].default_value *= .45
cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (Vector((0,-.1,.6)) - cam.location).length; cam.data.dof.aperture_fstop = 2.4

# 9. render
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = .03
sc.cycles.use_denoising = True; sc.cycles.max_bounces = 6
sc.render.resolution_x = 1440; sc.render.resolution_y = 900; sc.render.resolution_percentage = int(os.environ.get('PCT','100'))
sc.render.film_transparent = True; sc.view_settings.view_transform = 'Standard'
try: sc.view_settings.look = 'None'
except Exception: pass
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.filepath = os.path.abspath(f'render/{name}.png')
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(f'blend/{name}.blend'))
t1 = time.time()
bpy.ops.render.render(write_still=True)
print(f'DONE {name} setup {t1-t0:.0f}s render {time.time()-t1:.0f}s objects {len(scene_objs)}')
