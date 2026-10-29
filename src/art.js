(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CinemaArt=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  let spriteImage=null,spritesReady=false;
  function configure(factory){if(!factory)return;try{spriteImage=factory();if(spriteImage){spriteImage.onload=()=>spritesReady=true;spriteImage.onerror=()=>spritesReady=false;spriteImage.src='assets/toy/props-atlas.png';}}catch(e){spritesReady=false;}}
  function backdrop(){return false;}
  const props=[
    {name:'冻柠茶',color:'#e6b363',shade:'#925c35'},
    {name:'旋转电话',color:'#eb8d82',shade:'#904854'},
    {name:'胶片',color:'#b9a2df',shade:'#6d6089'},
    {name:'双程车票',color:'#83cbb8',shade:'#467e78'},
    {name:'黑胶唱片',color:'#91bed3',shade:'#43697c'},
    {name:'未寄出的信',color:'#e6c88c',shade:'#91724a'},
    {name:'菠萝包',color:'#e4a061',shade:'#9a5f37'},
    {name:'红色的士',color:'#d98088',shade:'#8d4858'},
    {name:'旧相机',color:'#b2b9cb',shade:'#666a87'},
    {name:'怀表',color:'#d1bd79',shade:'#8b7945'},
    {name:'录音带',color:'#92b997',shade:'#4f775d'},
    {name:'雨伞',color:'#c496bc',shade:'#86557f'}
  ];
  function rounded(c,x,y,w,h,r,fill,stroke){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else{r=Math.max(0,Math.min(r,w/2,h/2));c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.3;c.stroke();}}
  function line(c,p,color,width=1.5){c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}
  function circle(c,x,y,r,color,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.6;c.stroke();}}
  function polygon(c,p,color){c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();c.fillStyle=color;c.fill();}
  function prop(c,id,x,y,size){
    const meta=props[id-1];if(!meta)return;
    if(spritesReady){const sw=spriteImage.width/4,sh=spriteImage.height/3;c.drawImage(spriteImage,(id-1)%4*sw,Math.floor((id-1)/4)*sh,sw,sh,x,y,size,size);return;}
    c.save();c.translate(x,y);c.scale(size/64,size/64);
    const light='#fff0d8',dark='#29313d';
    // Small cast shadows and wide silhouettes stay legible on narrow phones.
    c.globalAlpha=.22;c.beginPath();c.ellipse(33,54,19,4,0,0,Math.PI*2);c.fillStyle='#060c15';c.fill();c.globalAlpha=1;
    if(id===1){ // Iced lemon tea, with actual lemon slices and a red straw.
      polygon(c,[[16,19],[48,19],[44,52],[21,52]],'#b67536');polygon(c,[[19,23],[45,23],[41,49],[24,49]],'#e7ad4d');
      polygon(c,[[20,28],[44,28],[41,48],[24,48]],'#c38436');line(c,[[21,21],[25,48]],'#ffe2a584',2);
      for(const [a,b] of [[25,27],[36,32],[29,39]]){rounded(c,a-3,b-3,8,8,2,'#f8e6c075');}
      circle(c,41,20,10,'#e8c761');circle(c,41,20,7,'#fbe7a2');for(let a=0;a<6;a++)line(c,[[41,20],[41+6*Math.cos(a*Math.PI/3),20+6*Math.sin(a*Math.PI/3)]],'#d7b758',.8);
      line(c,[[30,40],[34,11],[42,8]],'#e88e85',3);line(c,[[16,19],[48,19]],light,2);
    }
    if(id===2){
      rounded(c,12,33,41,19,7,'#ac5159');rounded(c,15,30,35,18,7,'#e29489');
      circle(c,32,38,10,'#603e49');circle(c,32,38,7,'#e4bdb0');circle(c,32,38,3,'#a36565');for(let a=0;a<8;a++)circle(c,32+5*Math.cos(a*Math.PI/4),38+5*Math.sin(a*Math.PI/4),1.3,'#75434d');
      c.save();c.translate(32,22);c.rotate(-.12);rounded(c,-23,-5,46,10,5,'#d98079');rounded(c,-24,-6,12,16,4,'#f0a599');rounded(c,12,-6,12,16,4,'#f0a599');line(c,[[-10,-3],[10,-3]],'#f7c5b4',1.5);c.restore();
      c.beginPath();c.moveTo(13,28);c.bezierCurveTo(2,32,11,43,10,48);c.strokeStyle='#e6a99a';c.lineWidth=2;c.stroke();
    }
    if(id===3){
      rounded(c,30,34,26,15,2,'#5b536f');for(let i=0;i<4;i++){rounded(c,33+i*5,36,3,2,0,'#c6b4dc');rounded(c,33+i*5,45,3,2,0,'#c6b4dc');}
      circle(c,27,29,21,'#76668d');circle(c,26,27,20,'#c7b2e2');circle(c,26,27,17,'#a18cbe');for(let a=0;a<5;a++)circle(c,26+10*Math.cos(a*1.256),27+10*Math.sin(a*1.256),4.5,'#494254');circle(c,26,27,3.5,'#dfd2ef');circle(c,26,27,1.3,'#635674');
    }
    if(id===4){
      c.save();c.translate(32,32);c.rotate(-.19);rounded(c,-23,-16,46,32,3,'#b5ddd1');rounded(c,-21,-14,42,10,1,'#619f94');
      for(let i=0;i<5;i++)line(c,[[10,-10+i*5],[10,-8+i*5]],'#76a295',1);
      c.fillStyle='#385f5a';c.font='700 7px sans-serif';c.textAlign='left';c.fillText('雙程',-17,3);c.font='5px sans-serif';c.fillText('HONG KONG',-17,10);for(let i=0;i<9;i++)rounded(c,-17+i*2.2,12,1.2,2,0,'#629186');c.restore();
    }
    if(id===5){
      rounded(c,12,12,34,41,2,'#567f8c');polygon(c,[[13,13],[45,13],[45,51],[13,51]],'#7aa4b1');polygon(c,[[13,51],[27,25],[45,47],[45,51]],'#d0a98b');
      circle(c,36,32,21,'#242c37');for(const r of [18,15,12])circle(c,36,32,r,null,'#54626d');circle(c,36,32,7,'#dcaa78');circle(c,36,32,2,'#354552');line(c,[[24,22],[26,20]],'#b5c4c8',1.5);
    }
    if(id===6){
      c.save();c.translate(32,33);c.rotate(-.1);rounded(c,-24,-16,48,32,3,'#e2c697');polygon(c,[[-23,-15],[0,3],[23,-15]],'#f3dfb6');line(c,[[-23,14],[-7,0]],'#bd9e73');line(c,[[23,14],[7,0]],'#bd9e73');circle(c,1,5,5,'#ac5e62');circle(c,1,5,3,null,'#d5948a');c.restore();
    }
    if(id===7){
      c.beginPath();c.ellipse(32,43,24,11,0,0,Math.PI*2);c.fillStyle='#c3b4a0';c.fill();c.beginPath();c.ellipse(32,41,24,10,0,0,Math.PI*2);c.fillStyle='#f2e3ca';c.fill();
      c.beginPath();c.ellipse(32,32,21,17,0,0,Math.PI*2);c.fillStyle='#a66937';c.fill();c.beginPath();c.ellipse(31,29,20,16,0,0,Math.PI*2);c.fillStyle='#e8b466';c.fill();
      for(let i=-1;i<=1;i++)line(c,[[15,25+i*5],[40,17+i*8]],'#b67d3e',1.5);for(let i=-1;i<=1;i++)line(c,[[24+i*7,16],[18+i*8,40]],'#b67d3e',1.5);rounded(c,25,23,11,8,1,'#f4d78b');
    }
    if(id===8){
      circle(c,18,46,7,'#242832');circle(c,47,46,7,'#242832');circle(c,18,46,3,'#bec0b8');circle(c,47,46,3,'#bec0b8');
      polygon(c,[[9,37],[15,34],[22,21],[43,21],[51,34],[57,37],[57,45],[8,45]],'#c6636b');polygon(c,[[20,33],[25,24],[33,24],[33,33]],'#b1c8c8');polygon(c,[[36,24],[42,24],[47,33],[36,33]],'#93b6bd');
      rounded(c,8,35,49,10,3,'#e28f8e');rounded(c,28,15,12,6,2,'#e9dfc4');line(c,[[9,41],[55,41]],'#f7c7ae',1);rounded(c,10,36,5,3,1,'#f7df9f');rounded(c,52,36,4,3,1,'#a34651');
    }
    if(id===9){
      rounded(c,11,23,43,29,5,'#5a6476');rounded(c,11,23,43,11,4,'#b9bcc7');rounded(c,17,17,14,8,2,'#bdc0c9');rounded(c,43,18,7,5,1,'#d4d2cd');rounded(c,14,26,8,5,1,'#3e4d5e');circle(c,36,38,13,'#323b4c');circle(c,36,38,10,'#8d9faf');circle(c,36,38,7,'#30495c');circle(c,34,36,3,'#81b0b6');circle(c,47,28,2,'#e3b781');
    }
    if(id===10){
      circle(c,32,12,5,null,'#dac58e');rounded(c,28,15,8,5,2,'#a88850');circle(c,32,37,20,'#a38552');circle(c,31,35,19,'#e6cf91');circle(c,31,35,15,'#f3e5ba');
      for(let i=0;i<12;i++){let a=i*Math.PI/6;line(c,[[31+12*Math.sin(a),35-12*Math.cos(a)],[31+13*Math.sin(a),35-13*Math.cos(a)]],'#897348',1);}
      line(c,[[31,24],[31,35],[39,39]],'#665a40',2);circle(c,31,35,2,'#b39355');
    }
    if(id===11){
      rounded(c,9,17,46,33,4,'#82a78b');rounded(c,13,21,38,16,3,'#3b5551');circle(c,24,29,6,'#c9d6b5');circle(c,42,29,6,'#c9d6b5');circle(c,24,29,2,'#5b7662');circle(c,42,29,2,'#5b7662');line(c,[[24,29],[42,29]],'#c9d6b5',1);polygon(c,[[19,48],[24,39],[42,39],[47,48]],'#cad2ad');rounded(c,28,43,9,3,1,'#5b7662');
    }
    if(id===12){
      c.beginPath();c.moveTo(9,32);c.bezierCurveTo(12,5,52,5,56,32);c.bezierCurveTo(49,26,44,26,40,32);c.bezierCurveTo(35,26,29,26,25,32);c.bezierCurveTo(19,26,13,26,9,32);c.fillStyle='#c89abf';c.fill();
      c.beginPath();c.moveTo(32,11);c.bezierCurveTo(23,18,23,24,25,32);c.moveTo(32,11);c.bezierCurveTo(42,18,43,24,40,32);c.strokeStyle='#986e9b';c.lineWidth=1.5;c.stroke();line(c,[[32,9],[32,47]],'#e4c3c9',2);c.beginPath();c.arc(28,47,4,0,Math.PI);c.strokeStyle='#e4c3c9';c.lineWidth=2;c.stroke();
    }
    c.restore();
  }
  function poster(c,x,y,w,h,time,accent,lit){
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.translate(x,y);
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#141925');g.addColorStop(.6,'#18252b');g.addColorStop(1,'#17232a');c.fillStyle=g;c.fillRect(0,0,w,h);
    // Dense original street scene: wet asphalt, hanging signs, and a tram.
    polygon(c,[[0,0],[w*.28,0],[w*.35,h*.7],[0,h]],'#26323c');polygon(c,[[w*.73,0],[w,0],[w,h],[w*.62,h*.7]],'#232e39');
    for(let i=0;i<8;i++){const yy=15+i*31;line(c,[[0,yy],[w*.3,yy+12]],'#59616b44',1);line(c,[[w*.73,yy+7],[w,yy-5]],'#57626c44',1);}
    for(let r=0;r<8;r++)for(let col=0;col<3;col++){const xx=9+col*19,yy=20+r*30;rounded(c,xx,yy,9,14,0,(r+col)%3?'#4c5e654d':'#e3ad6f55');rounded(c,w-xx-10,yy+8,8,13,0,(r+col)%4?'#4c5e653d':'#759c9d66');}
    const vx=w*.49,vy=h*.65;
    for(let i=0;i<8;i++){const xx=i*w/7;line(c,[[vx,vy],[xx,h]],'#697a7a20',1);}
    for(let i=0;i<7;i++){const yy=vy+Math.pow(i/6,1.8)*(h-vy);line(c,[[0,yy],[w,yy]],'#81958b15');}
    function sign(xx,yy,ww,hh,words,color,vertical){rounded(c,xx,yy,ww,hh,2,'#1d242a','#4c5557');c.save();c.shadowBlur=lit?9:3;c.shadowColor=color;c.strokeStyle=color;c.lineWidth=.9;c.strokeRect(xx+3,yy+3,ww-6,hh-6);c.fillStyle=color;c.font=`600 ${vertical?ww*.52:hh*.48}px "Microsoft YaHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';if(vertical)words.split('').forEach((v,i)=>c.fillText(v,xx+ww/2,yy+hh*(i+.6)/words.length));else c.fillText(words,xx+ww/2,yy+hh/2);c.restore();}
    sign(w*.12,h*.08,39,160,'金記冰室',accent,true);sign(w*.67,h*.22,32,123,'通宵放映','#73c6b9',true);sign(w*.32,h*.48,w*.29,29,'午夜戲院','#e4a5b7',false);
    sign(w*.02,h*.52,45,82,'茶餐廳','#dca68b',true);sign(w*.81,h*.49,39,90,'照相館','#88b6cb',true);
    // Tram at the vanishing point, and its long reflected headlights.
    rounded(c,vx-21,vy-44,42,64,4,'#36584f');rounded(c,vx-17,vy-38,34,24,2,'#a7bba6');line(c,[[vx,vy-38],[vx,vy-15]],'#456d63',2);rounded(c,vx-16,vy-7,32,15,1,'#b3b397');circle(c,vx-13,vy+12,3,'#f8d6a2');circle(c,vx+13,vy+12,3,'#f8d6a2');
    for(let i=0;i<16;i++){const yy=vy+27+i*5;const spread=4+i*1.2;c.globalAlpha=(1-i/16)*.35;line(c,[[vx-13-spread,yy],[vx-13+spread,yy]],'#e4bb7d',1);line(c,[[vx+13-spread,yy+2],[vx+13+spread,yy+2]],'#e4bb7d',1);}c.globalAlpha=1;
    // Neon reflections shimmer without moving the actual playfield.
    for(let i=0;i<26;i++){const yy=h*.72+i*3.5,xx=w*.2+Math.sin(i*2.3+time*.3)*9;c.globalAlpha=.12*(1-i/30);line(c,[[xx,yy],[xx+24+Math.sin(i)*14,yy]],accent,1.5);}c.globalAlpha=1;
    for(let i=0;i<28;i++){const xx=(i*73.7)%w,yy=(i*47.3+time*100)%h;c.globalAlpha=.12;line(c,[[xx,yy],[xx-3,yy+12]],'#bdcbd5',.7);}c.globalAlpha=1;
    const vignette=c.createLinearGradient(0,0,0,h);vignette.addColorStop(0,'#10151a00');vignette.addColorStop(.7,'#10151a00');vignette.addColorStop(1,'#0b1118dc');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    c.restore();
  }
  function toyScene(c,x,y,w,h,time=0){
    c.save();rounded(c,x,y,w,h,24,'#e5dfd3');const cx=x+w*.5,baseY=y+h*.74;
    const shade=c.createRadialGradient(cx,baseY,2,cx,baseY,w*.45);shade.addColorStop(0,'#608e732d');shade.addColorStop(1,'#608e7300');c.save();c.translate(0,baseY*.43);c.scale(1,.57);c.fillStyle=shade;c.fillRect(x,baseY-h*.1,w,h*.4);c.restore();
    c.beginPath();c.ellipse(cx,baseY,w*.41,h*.10,0,0,Math.PI*2);c.fillStyle='#c9c5b3';c.fill();rounded(c,x+w*.09,baseY-h*.08,w*.82,h*.11,12,'#ddd5c4');c.beginPath();c.ellipse(cx,baseY-h*.08,w*.41,h*.08,0,0,Math.PI*2);c.fillStyle='#f7ead8';c.fill();
    prop(c,3,x+w*.03,y+h*.31+Math.sin(time*.85)*3,w*.35);prop(c,2,x+w*.2,y+h*.12+Math.sin(time*.8+1)*4,w*.61);prop(c,1,x+w*.64,y+h*.28+Math.sin(time*.9+2)*3,w*.34);
    for(const [px,py,r,color]of [[.16,.19,5,'#dcb277'],[.83,.16,6,'#d9b5bb'],[.8,.69,3,'#5fa18a']]){c.beginPath();c.arc(x+w*px,y+h*py,r,0,Math.PI*2);c.fillStyle=color;c.fill();}c.restore();
  }
  return {props,prop,poster,configure,backdrop,toyScene,hasBackdrop:()=>spritesReady,hasSprites:()=>spritesReady};
});
