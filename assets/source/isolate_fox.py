"""Preserve only the authored fox studio from a temporary Blender copy.
Run with Blender --background /tmp/transforminals-fox-studio.blend --python this-file.
The user's original file and open Blender session are never modified.
"""
import bpy
ROOT='/Users/chris/Codex Projects/transforminals'
scene=bpy.data.scenes['Transforminals | Pip the fox']
bpy.context.window.scene=scene
keep=set(scene.objects)
for other in list(bpy.data.scenes):
    if other!=scene: bpy.data.scenes.remove(other)
for obj in list(bpy.data.objects):
    if obj not in keep: bpy.data.objects.remove(obj,do_unlink=True)
bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
bpy.ops.object.select_all(action='DESELECT')
root=bpy.data.objects['Pip_Fox_Root']
root.select_set(True)
for obj in root.children_recursive: obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/models/fox.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/source/fox.blend',compress=True)
print('ISOLATED_SCENES',[(s.name,len(s.objects)) for s in bpy.data.scenes])
print('FOX_MODEL_OBJECTS',len(root.children_recursive)+1)
