/* Original procedural models. Three.js is a build-time tool only. */
(function(root){
 const T=THREE;
 // Seeded clay grain: a shallow bump surface, never glossy plastic or metal.
 const grain=document.createElement('canvas');grain.width=grain.height=256;
 const gc=grain.getContext('2d'),pixels=gc.createImageData(256,256);let seed=68173;
 for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=115+(seed>>>25);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;}gc.putImageData(pixels,0,0);
 const bump=new T.CanvasTexture(grain);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(3,3);
 const mat=(color)=>new T.MeshStandardMaterial({color,metalness:0,roughness:1,bumpMap:bump,bumpScale:.025});
 const M={cream:mat('#fff1ce'),white:mat('#fffdf4'),coral:mat('#ee8176'),red:mat('#d95359'),pink:mat('#f2aba0'),mint:mat('#83c5ae'),jade:mat('#397e70'),dark:mat('#526366'),navy:mat('#66778a'),gold:mat('#d6aa55',.55,.25),lemon:mat('#f5d067'),pulp:mat('#ffedab'),lilac:mat('#b09bcb',.2),silver:mat('#c3c9be',.65,.24),blue:mat('#a0cbd8'),paper:mat('#f7e5bd'),sage:mat('#8fb59b'),mauve:mat('#bc91b3'),bread:mat('#d99b50'),butter:mat('#ffe5a2')};
 function mesh(g,geo,m,x=0,y=0,z=0){
  // Smooth low-frequency irregularity keeps tiny details recognizable.
  const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const a=pos.getX(i),b=pos.getY(i),c=pos.getZ(i);const f=1+.018*Math.sin(a*3.1+b*2.4+c*.9)*Math.cos(c*3.7-b*1.6);pos.setXYZ(i,a*f,b*f,c*f);}geo.computeVertexNormals();
  const ns=geo.attributes.normal,sums=new Map(),keys=[];
  for(let i=0;i<pos.count;i++){const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*10000)).join(',');keys.push(key);const sum=sums.get(key)||new T.Vector3();sum.add(new T.Vector3(ns.getX(i),ns.getY(i),ns.getZ(i)));sums.set(key,sum);}
  for(const sum of sums.values())sum.normalize();for(let i=0;i<pos.count;i++){const n=sums.get(keys[i]);ns.setXYZ(i,n.x,n.y,n.z);}
  const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
 function roundShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2,h/2);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
 function box(g,w,h,d,m,x=0,y=0,z=0,r=.12){const geo=new T.ExtrudeGeometry(roundShape(w,h,r),{depth:d,bevelEnabled:true,bevelSize:Math.min(.115,d*.32),bevelThickness:Math.min(.115,d*.32),bevelSegments:8,steps:1,curveSegments:8});geo.translate(0,0,-d/2);return mesh(g,geo,m,x,y,z);}
 function ball(g,r,m,x,y,z,sx=1,sy=1,sz=1){const o=mesh(g,new T.SphereGeometry(r,32,24),m,x,y,z);o.scale.set(sx,sy,sz);return o;}
 function cyl(g,r1,r2,h,m,x=0,y=0,z=0){return mesh(g,new T.CylinderGeometry(r1,r2,h,48),m,x,y,z);}
 function ring(g,r,t,m,x=0,y=0,z=0){return mesh(g,new T.TorusGeometry(r,t,12,56),m,x,y,z);}
 function tube(g,pts,r,m){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));return mesh(g,new T.TubeGeometry(curve,40,r,10,false),m);}
 function disk(g,r,h,m,x,y,z){const o=cyl(g,r,r,h,m,x,y,z);o.rotation.x=Math.PI/2;return o;}
 function phone(){const g=new T.Group();box(g,2.25,.6,1.45,M.coral,0,-.45,0,.29);box(g,1.9,.16,1.25,M.pink,0,-.08,0,.24);
  cyl(g,.53,.53,.11,M.dark,0,.12,.3);
  const dial=new T.Group();dial.rotation.x=-Math.PI/2+.28;dial.position.set(0,.2,.3);g.add(dial);disk(dial,.42,.08,M.gold,0,0,0);disk(dial,.23,.1,M.cream,0,0,.06);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;disk(dial,.065,.04,M.dark,.32*Math.cos(a),.32*Math.sin(a),.075);}
  box(g,.22,.42,.28,M.red,-.77,.12,-.27);box(g,.22,.42,.28,M.red,.77,.12,-.27);
  const receiver=new T.Group();receiver.position.set(0,.55,-.27);receiver.rotation.z=-.08;g.add(receiver);box(receiver,1.7,.26,.35,M.coral,0,0,0,.13);ball(receiver,.31,M.coral,-.91,-.06,0,1,1,1.12);ball(receiver,.31,M.coral,.91,-.06,0,1,1,1.12);tube(g,[[-1,.47,-.2],[-1.35,.15,-.1],[-1.23,-.3,.36],[-.96,-.48,.65]],.045,M.red);return g;}
 function tea(){const g=new T.Group();const glass=mat('#f1c481');
  cyl(g,.57,.43,1.9,glass,0,.15,0);cyl(g,.52,.51,.09,mat('#b67e44'),0,1.04,0);const rim=ring(g,.57,.035,M.white,0,1.1,0);rim.rotation.x=Math.PI/2;ring(g,.44,.04,M.cream,0,-.8,0).rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const o=box(g,.29,.25,.28,mat('#e4ead4',0,.18),Math.sin(i*2)*.25,1.09+(i%2)*.06,Math.cos(i*2)*.18,.055);o.rotation.set(i*.2,i*.7,i*.25);}
  tube(g,[[.15,.4,-.1],[.22,1.55,-.14],[.52,1.7,-.14]],.045,M.coral);
  const lemon=new T.Group();lemon.rotation.set(.08,-.3,-.2);lemon.position.set(-.36,.9,.25);g.add(lemon);disk(lemon,.37,.1,M.lemon,0,0,0);disk(lemon,.3,.115,M.pulp,0,0,.02);for(let i=0;i<6;i++){const a=i*Math.PI/3;tube(lemon,[[0,0,.09],[Math.cos(a)*.28,Math.sin(a)*.28,.09]],.012,M.lemon);}return g;}
 function reel(){const g=new T.Group(),shape=new T.Shape();shape.absarc(0,0,1.02,0,Math.PI*2,false);for(let i=0;i<5;i++){const a=i*2*Math.PI/5,p=new T.Path();p.absarc(Math.cos(a)*.61,Math.sin(a)*.61,.23,0,Math.PI*2,true);shape.holes.push(p);}const hub=new T.Path();hub.absarc(0,0,.12,0,Math.PI*2,true);shape.holes.push(hub);
  const geo=new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3,curveSegments:32});mesh(g,geo,M.lilac,0,.05,-.1);const strip=box(g,.85,.5,.16,M.navy,.9,-.65,-.2,.05);for(let i=0;i<3;i++){box(g,.07,.06,.03,M.cream,.68+i*.2,-.49,-.09,.01);box(g,.07,.06,.03,M.cream,.68+i*.2,-.8,-.09,.01);}g.rotation.y=-.1;return g;}
 function ticket(){const g=new T.Group();box(g,2.15,1.23,.14,M.mint,0,0,0,.1);box(g,2.02,.29,.025,M.jade,0,.39,.1,.05);for(let i=0;i<5;i++)box(g,.028,.09,.02,M.jade,.63,-.38+i*.15,.1,.01);
  for(let i=0;i<11;i++)box(g,i%2?.025:.045,.15,.02,M.jade,-.84+i*.1,-.42,.1,.01);
  box(g,.52,.37,.04,M.cream,-.45,.02,.12,.05);box(g,.4,.19,.025,M.blue,-.45,.06,.15,.02);for(const x of [-.6,-.3])disk(g,.045,.03,M.jade,x,-.18,.16);g.rotation.z=-.12;return g;}
 function vinyl(){const g=new T.Group();box(g,1.6,1.9,.14,M.blue,-.35,0,-.16,.09);box(g,1.4,1.7,.04,M.navy,-.35,0,-.06,.06);disk(g,.93,.14,M.dark,.35,.05,.07);for(const r of [.83,.72,.61])ring(g,r,.009,mat('#6c8486'),.35,.05,.16);disk(g,.28,.16,M.lemon,.35,.05,.1);disk(g,.055,.18,M.dark,.35,.05,.12);return g;}
 function envelope(){const g=new T.Group();box(g,2.12,1.4,.18,M.paper,0,0,0,.12);const shape=new T.Shape();shape.moveTo(-1,.61);shape.lineTo(1,.61);shape.lineTo(0,-.1);shape.closePath();mesh(g,new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.015,bevelThickness:.015}),M.cream,0,0,.12);disk(g,.19,.12,M.red,0,-.1,.2);ring(g,.12,.015,M.pink,0,-.1,.28);g.rotation.z=-.1;return g;}
 function bun(){const g=new T.Group();cyl(g,.98,.86,.1,M.cream,0,-.62,0);ball(g,.86,M.bread,0,-.1,0,1,.75,.88);const golden=mat('#e9bc71');ball(g,.82,golden,0,.1,0,1,.55,.88);
  for(let i=-1;i<=1;i++){const off=i*.29;tube(g,[[-.66,.31,off-.14],[0,.54,off],[.65,.31,off+.14]],.018,M.bread);tube(g,[[off-.14,.31,-.61],[off,.54,0],[off+.14,.31,.6]],.018,M.bread);}const b=box(g,.5,.11,.37,M.butter,0,.59,.06,.04);b.rotation.y=.15;return g;}
 function taxi(){const g=new T.Group();box(g,2.5,.51,1.15,M.red,0,-.25,0,.2);box(g,1.55,.58,1.02,M.cream,-.05,.2,-.02,.17);box(g,1.23,.36,.035,M.blue,-.05,.23,.53,.07);box(g,.035,.34,.75,M.blue,.75,.23,-.01,.04);
  box(g,.28,.15,.33,M.lemon,0,.62,0,.04);for(const x of [-.8,.8])for(const z of [-.58,.58]){const wheel=cyl(g,.26,.26,.14,M.dark,x,-.5,z);wheel.rotation.x=Math.PI/2;disk(g,.13,.16,M.silver,x,-.5,z+(z>0?.02:-.02));}for(const z of [-.36,.36])box(g,.04,.14,.2,M.lemon,1.27,-.16,z,.025);return g;}
 function camera(){const g=new T.Group();box(g,2,.99,.7,M.dark,0,-.06,0,.16);box(g,2.02,.26,.74,M.silver,0,.4,0,.1);box(g,.55,.17,.37,M.dark,-.4,.64,0,.06);box(g,.24,.12,.26,M.coral,.65,.61,0,.035);disk(g,.53,.28,M.silver,.25,-.04,.45);disk(g,.41,.32,M.navy,.25,-.04,.58);disk(g,.29,.34,M.blue,.25,-.04,.62);disk(g,.14,.36,M.dark,.25,-.04,.65);ball(g,.07,M.white,.15,.08,.85);box(g,.35,.2,.04,M.mint,-.59,.39,.4,.035);return g;}
 function watch(){const g=new T.Group();disk(g,.88,.25,M.gold,0,-.02,0);disk(g,.74,.3,M.cream,0,-.02,.03);ring(g,.78,.035,M.gold,0,-.02,.2);box(g,.23,.18,.22,M.gold,0,.93,0,.04);ring(g,.2,.055,M.gold,0,1.18,0);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const o=box(g,.035,.09,.025,M.gold,.61*Math.sin(a),-.02+.61*Math.cos(a),.22,.01);o.rotation.z=-a;}
  tube(g,[[0,.39,.26],[0,-.02,.26],[.35,-.24,.26]],.028,M.dark);disk(g,.055,.04,M.coral,0,-.02,.27);return g;}
 function cassette(){const g=new T.Group();box(g,2.15,1.36,.23,M.sage,0,0,0,.13);box(g,1.88,.66,.05,M.cream,0,.1,.16,.1);box(g,1.72,.42,.04,M.dark,0,.11,.21,.05);for(const x of [-.52,.52]){disk(g,.22,.08,M.paper,x,.12,.24);disk(g,.08,.1,M.jade,x,.12,.26);}box(g,.75,.21,.05,M.jade,0,-.45,.17,.06);for(const x of [-.88,.88])for(const y of [-.49,.49])disk(g,.035,.025,M.gold,x,y,.13);return g;}
 function umbrella(){const g=new T.Group(),points=[];for(let i=0;i<=14;i++){const t=i/14*Math.PI/2;points.push(new T.Vector2(1.12*Math.sin(t),.25+.8*Math.cos(t)));}const geo=new T.LatheGeometry(points,64);mesh(g,geo,Object.assign(mat('#bc91b3'),{side:T.DoubleSide}),0,.1,0);for(let i=0;i<8;i++){const a=i*Math.PI/4;const pts=[];for(let j=0;j<=12;j++){let t=j/12*Math.PI/2;pts.push([1.12*Math.sin(t)*Math.cos(a),.35+.8*Math.cos(t),1.12*Math.sin(t)*Math.sin(a)]);}tube(g,pts,.014,mat('#d9b6ce'));}tube(g,[[0,1.22,0],[0,-.7,0],[-.08,-.98,0],[-.32,-1.03,0],[-.47,-.82,0]],.045,M.cream);return g;}
 const creators=[tea,phone,reel,ticket,vinyl,envelope,bun,taxi,camera,watch,cassette,umbrella];
 function renderAtlas(cell=512){const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(cell*4,cell*3);renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setScissorTest(true);
  const camera=new T.OrthographicCamera(-1.9,1.9,1.9,-1.9,.1,50);camera.position.set(4.7,3.4,7.8);camera.lookAt(0,.15,0);
  for(let i=0;i<12;i++){const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff5e9','#aaa39c',2.6));const key=new T.DirectionalLight('#fff1e4',2.6);key.position.set(-3,6,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.normalBias=.03;key.shadow.bias=-.0001;key.shadow.radius=3;scene.add(key);const fill=new T.DirectionalLight('#e6e2f3',1.6);fill.position.set(4,2,-3);scene.add(fill);
   const item=creators[i]();scene.add(item);const bounds=new T.Box3().setFromObject(item),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),scale=2.65/Math.max(size.x,size.y,size.z);item.scale.setScalar(scale);item.position.sub(center.multiplyScalar(scale));item.position.y+=.15;
   const plane=new T.Mesh(new T.PlaneGeometry(7,7),new T.ShadowMaterial({color:'#34534a',opacity:.18}));plane.rotation.x=-Math.PI/2;plane.position.y=-1.32;plane.receiveShadow=true;// Contact shadows are composed softly by the game renderer.
   const x=i%4*cell,y=(2-Math.floor(i/4))*cell;renderer.setViewport(x,y,cell,cell);renderer.setScissor(x,y,cell,cell);renderer.clear();renderer.render(scene,camera);
  }renderer.domElement.id='atlas';return renderer.domElement;
 }
 root.ToyStudio={renderAtlas};
})(globalThis);
