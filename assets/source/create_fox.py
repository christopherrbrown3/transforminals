"""Original Transforminals fox. Run in Blender; creates an isolated scene.
Runtime convention: X right, Y up, facing -Z. Converted to Blender Z-up.
"""
import bpy, math
from mathutils import Vector
ROOT='/Users/chris/Codex Projects/transforminals'
scene = bpy.data.scenes.new('Transforminals | Pip the fox')
previous_scene=bpy.context.window.scene
bpy.context.window.scene=scene
scene['transforminals_previous_scene']=previous_scene.name
scene.world=bpy.data.worlds.new('Transforminals soft mint world')
scene.world.color=(0.35,0.48,0.43)
scene.render.resolution_x=1000
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=ROOT+'/assets/source/fox-preview.png'
try: scene.render.engine='BLENDER_EEVEE_NEXT'
except TypeError: scene.render.engine='CYCLES'
if scene.render.engine=='CYCLES': scene.cycles.samples=24
scene.view_settings.view_transform='Standard'
scene.render.film_transparent=True

def material(name, hexcode):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    rgb=tuple(int(hexcode[i:i+2],16)/255 for i in (0,2,4))
    # Convert sRGB authored colors to linear for glTF correct color appearance.
    linear=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)
    shader=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value=(*linear,1)
    shader.inputs['Roughness'].default_value=.78
    m.diffuse_color=(*linear,1)
    return m
orange=material('Pip | warm marmalade','E6873E')
light=material('Pip | peach ear','F3B16F')
cream=material('Pip | vanilla fur','FFF0CD')
ink=material('Pip | cocoa nose and socks','493E3A')
eye=material('Pip | deep evergreen eyes','243C3B')
white=material('Pip | warm eye whites','FFF9EC')
pink=material('Pip | inner ears','C97469')

def xyz(p): return (p[0],-p[2],p[1])
def empty(name, pos, parent=None):
    o=bpy.data.objects.new(name,None)
    scene.collection.objects.link(o)
    o.location=xyz(pos)
    o.parent=parent
    return o
root=empty('Pip_Fox_Root',(0,0,0))
root['license']='MIT; original model created for Transforminals'
root['author']='christopherrbrown3 / Transforminals'
root['front']='negative Z after glTF conversion'

def cube(name,size,pos,mat,parent=root,bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0))
    o=bpy.context.object
    o.name=name
    o.parent=parent
    o.location=xyz(pos)
    o.dimensions=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Tiny toy edge bevel','BEVEL')
        mod.width=bevel
        mod.segments=1
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.modifier_apply(modifier=mod.name)
        weighted=o.modifiers.new('Weighted toy normals','WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=weighted.name)
    return o

def ear(name,x):
    verts=[(x-.16,.25,.24),(x+.16,.25,.24),(x+.05,.28,.75),(x-.16,-.08,.24),(x+.16,-.08,.24),(x+.05,-.04,.75)]
    # Local input is Blender x, y, z, pointed ears with a flat front face.
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)])
    mesh.materials.append(orange)
    obj=bpy.data.objects.new(name,mesh)
    scene.collection.objects.link(obj)
    obj.parent=head
    return obj

cube('Soft square body',(.77,.67,1.2),(0,.75,.12),orange,bevel=.09)
cube('Cream chest bib',(.55,.47,.16),(0,.76,-.49),cream,bevel=.04)
legs=[]
for i,(x,z) in enumerate([(-.25,-.3),(.25,-.3),(-.25,.57),(.25,.57)]):
    pivot=empty('Leg pivot '+str(i),(x,.48,z),root)
    cube('Marmalade leg '+str(i),(.23,.35,.25),(0,-.15,0),orange,pivot,.035)
    cube('Cocoa sock '+str(i),(.24,.16,.27),(0,-.38,-.01),ink,pivot,.025)
    cube('Paw '+str(i),(.27,.12,.36),(0,-.42,-.05),ink,pivot,.03)
    legs.append(pivot)
head=empty('Friendly head pivot',(0,1.12,-.55),root)
cube('Broad friendly face',(.76,.62,.64),(0,0,0),orange,head,.07)
cube('Left cheek cream',(.34,.28,.22),(-.23,-.15,-.29),cream,head,.06)
cube('Right cheek cream',(.34,.28,.22),(.23,-.15,-.29),cream,head,.06)
cube('Tapered muzzle',(.45,.26,.44),(0,-.16,-.45),cream,head,.07)
cube('Button nose',(.23,.15,.14),(0,-.10,-.69),ink,head,.035)
for s in [-1,1]:
    ear('Pointed ear '+str(s),s*.27)
    cube('Inner ear '+str(s),(.13,.22,.025),(s*.28,.42,-.255),pink,head,.015)
    cube('Eye white '+str(s),(.22,.24,.045),(s*.23,.07,-.329),white,head,.025)
    cube('Eye pupil '+str(s),(.11,.15,.035),(s*.23+.018,.05,-.359),eye,head,.015)
    cube('Eye gleam '+str(s),(.038,.047,.02),(s*.23+.034,.09,-.38),white,head,.007)
    cube('Eyebrow '+str(s),(.24,.055,.055),(s*.23,.24,-.33),ink,head,.015)
tail=empty('Bushy tail pivot',(0,.72,.66),root)
cube('Tail base',(.34,.34,.47),(0,.09,.19),orange,tail,.07)
cube('Bushy tail',(.5,.49,.65),(0,.24,.61),orange,tail,.095)
cube('Vanilla tail tip',(.44,.44,.38),(0,.32,1.05),cream,tail,.085)
# Idle animation: fox cocks its head and swishes its tail.
scene.render.fps=24
scene.frame_start=1
scene.frame_end=48
for frame,angle in [(1,-.16),(13,.15),(25,-.16),(37,.15),(48,-.16)]:
    tail.rotation_euler[2]=angle
    tail.keyframe_insert(data_path='rotation_euler',frame=frame)
for frame,angle in [(1,-.035),(13,.035),(25,-.035),(37,.035),(48,-.035)]:
    head.rotation_euler[1]=angle
    head.keyframe_insert(data_path='rotation_euler',frame=frame)
for obj in [tail,head]:
    obj.animation_data.action.name='Pip | curious idle | '+obj.name
scene.frame_set(1)
# Model-only GLB export. Stage lights and camera are added afterward.
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects: obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/models/fox.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_yup=True)
# Saved editable studio scene, without touching the user's existing .blend.
cam_data=bpy.data.cameras.new('Pip studio camera')
cam=bpy.data.objects.new('Pip studio camera',cam_data)
scene.collection.objects.link(cam)
cam.location=(3.5,4.8,3)
target=Vector((0,-.05,.9))
cam.rotation_euler=(target-Vector(cam.location)).to_track_quat('-Z','Y').to_euler()
cam_data.type='ORTHO'
cam_data.ortho_scale=3.6
scene.camera=cam
for name,location,energy,size in [('Key',(3,4,6),650,5),('Fill',(-4,1,4),450,4),('Rim',(0,-4,5),700,3)]:
    data=bpy.data.lights.new(name,'AREA')
    data.energy=energy
    data.shape='DISK'
    data.size=size
    lamp=bpy.data.objects.new(name,data)
    scene.collection.objects.link(lamp)
    lamp.location=location
    lamp.rotation_euler=(Vector((0,0,1))-Vector(location)).to_track_quat('-Z','Y').to_euler()
# Safe-mode-compatible copy. Run isolate_fox.py in background Blender next.
bpy.ops.wm.save_as_mainfile(filepath='/tmp/transforminals-fox-studio.blend', copy=True)
print('Created isolated scene:',scene.name)
print('Original active file preserved:',bpy.data.filepath)
print('Saved temporary copy; isolate_fox.py produces the standalone fox.blend')
bpy.ops.render.render(write_still=True)
print('Rendered',scene.render.filepath)
