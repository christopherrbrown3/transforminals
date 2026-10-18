import * as THREE from 'three';
interface Burst {mesh:THREE.InstancedMesh;positions:THREE.Vector3[];velocities:THREE.Vector3[];life:number;duration:number;}
export class Effects {
 private bursts:Burst[]=[];private dummy=new THREE.Object3D();reduced=false;
 constructor(private scene:THREE.Scene){}
 burst(position:THREE.Vector3,color=0xffd36d,count=60){count=this.reduced?12:count;const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(0.13,0.13,0.13),new THREE.MeshBasicMaterial({color}),count);const positions=[],velocities=[];
 for(let i=0;i<count;i++){positions.push(position.clone());const angle=Math.random()*Math.PI*2;const speed=2+Math.random()*4;velocities.push(new THREE.Vector3(Math.cos(angle)*speed,3+Math.random()*5,Math.sin(angle)*speed));mesh.setColorAt(i,new THREE.Color([color,0xffe5a0,0xe78f98,0x9ccfb0,0xaab8e9][i%5]));}
 mesh.frustumCulled=false;this.scene.add(mesh);this.bursts.push({mesh,positions,velocities,life:0,duration:2.2});}
 tick(dt:number){for(const b of this.bursts){b.life+=dt;for(let i=0;i<b.positions.length;i++){b.velocities[i].y-=8*dt;b.positions[i].addScaledVector(b.velocities[i],dt);this.dummy.position.copy(b.positions[i]);this.dummy.rotation.set(b.life*3+i,b.life*2,0);this.dummy.scale.setScalar(Math.max(0,1-b.life/b.duration));this.dummy.updateMatrix();b.mesh.setMatrixAt(i,this.dummy.matrix);}b.mesh.instanceMatrix.needsUpdate=true;}
 this.bursts=this.bursts.filter(b=>{if(b.life<b.duration)return true;this.scene.remove(b.mesh);b.mesh.geometry.dispose();(b.mesh.material as THREE.Material).dispose();return false;});}
 clear(){for(const b of this.bursts){this.scene.remove(b.mesh);b.mesh.geometry.dispose();(b.mesh.material as THREE.Material).dispose();}this.bursts=[];}
}
export function label(text:string,color='#fff5dc',width=5):THREE.Sprite {
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#294e41';ctx.beginPath();ctx.roundRect(4,12,760,130,32);ctx.fill();ctx.font='600 42px Fredoka, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,384,77,720);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));sprite.scale.set(width,width*160/768,1);sprite.renderOrder=1;return sprite;
}
export function disposeObject(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();root.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material){for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){materials.add(m);const map=(m as THREE.MeshStandardMaterial).map;if(map)textures.add(map);}}});for(const g of geometries)g.dispose();for(const t of textures)t.dispose();for(const m of materials)m.dispose();}
