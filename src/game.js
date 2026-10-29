(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine'),require('./campaign'),require('./boards'),require('./art'),require('./meta'));
  else root.LaneGame=factory(root.LaneEngine,root.CinemaCampaign,root.CinemaBoards,root.CinemaArt,root.CinemaMeta);
})(typeof globalThis!=='undefined'?globalThis:this,function(E,Campaign,Boards,Art,Meta){
  'use strict';
  const C={bg:'#f5eee5',panel:'#fff8ed',line:'#d3dbcf',paper:'#244f44',muted:'#7f8e80',ink:'#244f44',gold:'#dfad62',cyan:'#5ca98d'};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=t=>1-Math.pow(1-clamp(t),3);
  const clone=b=>b.map(r=>r.slice());
  function mount(canvas,wxapi){
    const ctx=canvas.getContext('2d');let W,H,DPR,wide,layout,hits=[],last=Date.now(),disposed=false,frame,audioContext;
    let hover=null,mouse={x:-1,y:-1},mapAct=0,streetBackdrop=null,drag=null;
    const cleanup=[];let musicPlayer=null;
    Art.configure(wxapi?(wxapi.createImage?()=>wxapi.createImage():null):()=>new Image());
    const storage={get(k){try{return wxapi?wxapi.getStorageSync(k):localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{if(wxapi)wxapi.setStorageSync(k,v);else localStorage.setItem(k,String(v));}catch(e){}},remove(k){try{if(wxapi)wxapi.removeStorageSync?.(k);else localStorage.removeItem(k);}catch(e){}}};
    const json=k=>{try{return JSON.parse(storage.get(k)||'null');}catch(e){return null;}};
    const loadedProgress=json('neon-progress-v2');const progress=Meta.validProgress(loadedProgress)?loadedProgress:{};
    const settings=json('neon-settings-v3')||{};
    const state={board:[],level:0,unlocked:clamp(Number(progress.unlocked)||0,0,59),records:progress.records||{},stats:{props:{},bends:0,maxCombo:0,...progress.stats},daily:progress.daily||{},storySeen:progress.storySeen||{},screen:'home',dailyChallenge:null,galleryAct:0,selectedProp:0,settingsTab:'main',haptics:settings.haptics!==false,music:settings.music!==false,labels:!!settings.labels,selected:null,hint:null,effects:[],particles:[],score:0,combo:0,removed:0,bends:0,elapsed:0,clock:0,lastMatch:-100,neonUntil:0,streak:0,rewindsUsed:0,hintsUsed:0,shufflesUsed:0,history:[],paused:false,modal:null,sound:storage.get('neon-sound')!=='off',motion:settings.motion!==false,toast:'',toastUntil:0,pendingWin:null,dealAt:0,shake:null,hover:null,uiTime:0};
    if(settings.motion===undefined&&!wxapi&&typeof matchMedia==='function')state.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    const level=()=>Campaign.levels[state.level],act=()=>Campaign.acts[level().act];
    function saveProgress(){storage.set('neon-progress-v2',JSON.stringify({unlocked:state.unlocked,records:state.records,stats:state.stats,daily:state.daily,storySeen:state.storySeen}));}
    function saveSettings(){storage.set('neon-settings-v3',JSON.stringify({motion:state.motion,music:state.music,haptics:state.haptics,labels:state.labels}));storage.set('neon-sound',state.sound?'on':'off');syncMusic();}
    function syncMusic(){try{if(!state.music||state.paused){musicPlayer?.pause();return;}if(!musicPlayer){if(wxapi){musicPlayer=wxapi.createInnerAudioContext?.();if(musicPlayer)musicPlayer.src='assets/midnight.wav';}else musicPlayer=new Audio('assets/midnight.wav');if(musicPlayer){musicPlayer.loop=true;musicPlayer.volume=.22;}}if(musicPlayer){const p=musicPlayer.play();p?.catch?.(()=>{});}}catch(e){}}
    function checkpoint(){
      if(state.removed>=level().pairs*2)return;
      storage.set('neon-checkpoint-v2',JSON.stringify({level:state.level,board:state.board,score:state.score,removed:state.removed,bends:state.bends,bestCombo:state.bestCombo,elapsed:state.elapsed,rewindsUsed:state.rewindsUsed,hintsUsed:state.hintsUsed,shufflesUsed:state.shufflesUsed,history:state.history.slice(-2),dailyChallenge:state.dailyChallenge}));saveProgress();
    }
    function validSave(s,unlocked=state.unlocked){
      if(!s||!Number.isInteger(s.level)||s.level<0||s.level>unlocked)return false;
      const l=Campaign.levels[s.level];if(!Array.isArray(s.board)||s.board.length!==l.rows)return false;
      for(const k of ['score','removed','bends','elapsed','rewindsUsed','hintsUsed','shufflesUsed'])if(!Number.isFinite(s[k])||s[k]<0)return false;
      if(!Number.isInteger(s.removed)||s.removed%2||!Number.isInteger(s.rewindsUsed)||s.rewindsUsed>2)return false;
      if(s.dailyChallenge!==undefined&&s.dailyChallenge!==null&&(typeof s.dailyChallenge!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s.dailyChallenge)))return false;
      if(s.history!==undefined&&(!Array.isArray(s.history)||s.history.length>2||s.history.some(h=>!h||!Number.isFinite(h.score)||!Number.isFinite(h.removed)||!Number.isFinite(h.bends)||!Array.isArray(h.board)||h.board.length!==l.rows||h.board.some(row=>!Array.isArray(row)||row.length!==l.cols||row.some(v=>!Number.isInteger(v)||v<0||v>l.types)))))return false;
      const counts=new Map();let n=0;
      for(const row of s.board){if(!Array.isArray(row)||row.length!==l.cols)return false;for(const v of row){if(!Number.isInteger(v)||v<0||v>l.types)return false;if(v){counts.set(v,(counts.get(v)||0)+1);n++;}}}
      return n>0&&n%2===0&&n+s.removed===l.pairs*2&&[...counts.values()].every(n=>n%2===0);
    }
    function resetFields(){Object.assign(state,{selected:null,hint:null,effects:[],particles:[],score:0,combo:0,bestCombo:0,removed:0,bends:0,elapsed:0,lastMatch:-100,streak:0,neonUntil:0,rewindsUsed:0,hintsUsed:0,shufflesUsed:0,history:[],paused:false,modal:null,pendingWin:null,dealAt:state.clock,shake:null,toast:'',toastUntil:0});}
    function startLevel(id){state.level=clamp(id,0,59);state.screen='play';state.dailyChallenge=null;resetFields();state.board=clone(Boards[state.level].board);mapAct=level().act;resize();checkpoint();}
    function home(){if(state.removed>=level().pairs*2)startLevel(Math.min(59,state.level+1));else checkpoint();state.screen='home';state.modal=null;state.paused=false;}
    function continueGame(){if(state.removed>=level().pairs*2)startLevel(state.level);state.screen='play';state.paused=false;if(!state.storySeen[level().act]&&level().step===0&&state.removed===0)state.modal='story';else state.modal=null;}
    function startDaily(){const date=Meta.dateKey();if(!state.daily[date])state.daily[date]={level:Meta.dailyLevel(state.unlocked,date)};const id=state.daily[date].level;startLevel(id);state.dailyChallenge=date;checkpoint();}
    function toast(s){state.toast=s;state.toastUntil=state.uiTime+2;}
    function sound(kind){
      if(wxapi){if(state.haptics&&(kind==='match'||kind==='neon'))wxapi.vibrateShort?.({type:'light'});return;}
      if(state.haptics&&(kind==='match'||kind==='neon'))try{if(window.NeonHost?.haptic)window.NeonHost.haptic();else navigator.vibrate?.(8);}catch(e){}
      if(!state.sound)return;
      try{
        audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();
        const now=audioContext.currentTime,notes=kind==='match'?[440+Math.min(state.combo,9)*32,660+Math.min(state.combo,9)*24]:kind==='neon'?[523,659,784,1047]:kind==='win'?[523,659,784,1047,1318]:kind==='miss'?[155]:[330];
        notes.forEach((freq,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=kind==='miss'?'triangle':'sine';o.frequency.setValueAtTime(freq,now+i*.055);o.frequency.exponentialRampToValueAtTime(freq*.92,now+i*.055+.23);o.connect(g);g.connect(audioContext.destination);g.gain.setValueAtTime(.0001,now+i*.055);g.gain.exponentialRampToValueAtTime(kind==='select'?.018:.045,now+i*.055+.008);g.gain.exponentialRampToValueAtTime(.0001,now+i*.055+.24);o.start(now+i*.055);o.stop(now+i*.055+.25);});
      }catch(e){}
    }
    function resize(){
      const info=wxapi?(wxapi.getWindowInfo?wxapi.getWindowInfo():wxapi.getSystemInfoSync()):{windowWidth:window.innerWidth,windowHeight:window.innerHeight,pixelRatio:window.devicePixelRatio};
      W=info.windowWidth;H=info.windowHeight;DPR=Math.min(info.pixelRatio||1,2);canvas.width=W*DPR;canvas.height=H*DPR;wide=W>=1100;
      const l=level(),left=wide?Math.max(32,(W-1280)/2):0;
      const areaX=wide?left+330:22,areaW=wide?Math.min(520,W-left-330-230):W-44;
      const compact=!wide&&H<740,top=wide?205:compact?160:190,bottom=wide?158:compact?112:156;
      const size=Math.min(wide?88:80,areaW/l.cols,(H-top-bottom)/l.rows);
      const bw=size*l.cols,bh=size*l.rows,x=areaX+(areaW-bw)/2,y=top+Math.min(wide?28:18,Math.max(0,(H-top-bottom-bh)/2));
      layout={size,bw,bh,x,y,areaX,areaW,left,rightX:areaX+areaW+38,rows:l.rows,cols:l.cols,compact};
      streetBackdrop=null;
    }
    function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else{r=Math.max(0,Math.min(r,w/2,h/2));ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
    function text(s,x,y,size=13,color=C.paper,align='left',weight=400,font){ctx.font=`${weight} ${size}px ${font||'"Microsoft YaHei","PingFang SC",sans-serif'}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
    function line(points,color,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
    function circle(x,y,r,color,stroke){ctx.beginPath();ctx.arc(x,y,Math.max(.01,r),0,Math.PI*2);if(color){ctx.fillStyle=color;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}}
    function star(x,y,r,color){const pts=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rad=i%2?r*.43:r;pts.push([x+Math.cos(a)*rad,y+Math.sin(a)*rad]);}ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
    function button(id,x,y,w,h,label,fn,style='outline',disabled=false){
      const active=hover===id&&!disabled,primary=style==='primary',r=Math.min(20,h/2);
      ctx.save();ctx.shadowColor='#80634a24';ctx.shadowBlur=9;ctx.shadowOffsetY=4;rect(x,y+3,w,h,r,primary?'#567d64':'#d5c8b7');ctx.restore();
      const clayFill=ctx.createLinearGradient(x,y,x,y+h);clayFill.addColorStop(0,primary?(active?'#78a188':'#82aa91'):active?'#f4ead9':'#fff6e8');clayFill.addColorStop(1,primary?'#659176':'#e9ddc9');rect(x,y,w,h,r,clayFill,primary?'#87ac91':'#f6eddf');
      ctx.globalAlpha=disabled?.4:1;text(label,x+w/2,y+h/2,12,primary?'#fffaf0':C.paper,'center',primary?650:500);ctx.globalAlpha=1;
      if(!disabled)hits.push({id,x,y,w,h,fn});
    }
    function icon(kind,x,y,s,color){
      ctx.save();ctx.translate(x,y);ctx.scale(s/24,s/24);ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      if(kind==='pause'){ctx.moveTo(8,5);ctx.lineTo(8,19);ctx.moveTo(16,5);ctx.lineTo(16,19);}
      if(kind==='reel'){ctx.arc(12,12,9,0,Math.PI*2);for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.moveTo(12+5*Math.cos(a)+1.8,12+5*Math.sin(a));ctx.arc(12+5*Math.cos(a),12+5*Math.sin(a),1.8,0,Math.PI*2);}}
      if(kind==='rewind'){ctx.moveTo(11,5);ctx.lineTo(3,12);ctx.lineTo(11,19);ctx.closePath();ctx.moveTo(21,5);ctx.lineTo(13,12);ctx.lineTo(21,19);ctx.closePath();}
      if(kind==='sound'){ctx.moveTo(3,10);ctx.lineTo(7,10);ctx.lineTo(13,5);ctx.lineTo(13,19);ctx.lineTo(7,14);ctx.lineTo(3,14);ctx.closePath();ctx.moveTo(17,7);ctx.bezierCurveTo(22,11,22,13,17,17);}
      ctx.stroke();ctx.restore();
    }
    const point=p=>[layout.x+(p.c+.5)*layout.size,layout.y+(p.r+.5)*layout.size];
    function turns(path){let count=0,prev;for(let i=1;i<path.length;i++){const dir=`${path[i].r-path[i-1].r},${path[i].c-path[i-1].c}`;if(prev&&dir!==prev)count++;prev=dir;}return count;}
    function burst(p,color){if(!state.motion)return;for(let i=0;i<15;i++){const a=Math.random()*Math.PI*2,speed=30+Math.random()*105;state.particles.push({r:p.r,c:p.c,ox:0,oy:0,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-25,life:1,color,spin:Math.random()*6,size:1+Math.random()*2.8});}}
    function actTile(r,c){
      if(state.screen!=='play'||state.paused||state.modal||state.pendingWin||!state.board[r]?.[c])return;
      state.hint=null;const a=state.selected,b={r,c};
      if(!a){state.selected={...b,at:state.clock};sound('select');return;}
      if(a.r===r&&a.c===c){state.selected=null;return;}
      const path=E.findPath(state.board,a,b);
      if(!path){state.shake={a,b,at:state.clock};state.selected={...b,at:state.clock};sound('miss');return;}
      const type=state.board[r][c],bent=turns(path);
      state.history.push({board:clone(state.board),score:state.score,removed:state.removed,bends:state.bends});if(state.history.length>2)state.history.shift();
      state.board[a.r][a.c]=state.board[r][c]=0;state.selected=null;state.removed+=2;if(bent===2)state.bends++;
      state.combo=state.clock-state.lastMatch<5.5?state.combo+1:1;state.streak=state.combo===1?1:state.streak+1;state.lastMatch=state.clock;
      state.bestCombo=Math.max(state.bestCombo,state.combo);
      if(state.streak>=5){state.neonUntil=state.clock+7;state.streak=0;sound('neon');}
      const bonus=(100+Math.min(state.combo-1,9)*15+bent*20)*(state.clock<state.neonUntil?2:1);state.score+=bonus;
      state.stats.props[type]=(state.stats.props[type]||0)+1;state.stats.bends+=(bent===2?1:0);state.stats.maxCombo=Math.max(state.stats.maxCombo,state.combo);
      state.effects.push({path,a:{r:a.r,c:a.c},b,type,at:state.clock,bonus,bent});burst(a,Art.props[type-1].color);burst(b,act().secondary);sound('match');
      if(state.removed===level().pairs*2)state.pendingWin=state.clock+(state.motion?.65:.08);
      else if(!E.moves(state.board)){state.board=E.reshuffle(state.board);state.history=[];state.dealAt=state.clock;toast('已自动换位');}
      checkpoint();
    }
    function finish(){
      const l=level();const stars=1+(state.elapsed<=l.par?1:0)+(Campaign.objectiveMet(l,state)?1:0),old=state.records[state.level];
      state.result={stars,score:state.score,time:state.elapsed};
      state.records[state.level]={stars:Math.max(old?.stars||0,stars),score:Math.max(old?.score||0,state.score),time:Math.min(old?.time||Infinity,state.elapsed)};
      if(state.dailyChallenge){const d=state.daily[state.dailyChallenge]||{level:state.level};state.daily[state.dailyChallenge]={...d,completed:true,score:Math.max(d.score||0,state.score),time:Math.min(d.time||Infinity,state.elapsed)};}
      state.unlocked=Math.max(state.unlocked,Math.min(59,state.level+1));saveProgress();storage.remove('neon-checkpoint-v2');state.pendingWin=null;state.modal='win';state.winAtUi=state.uiTime;sound('win');
    }
    function hint(){if(state.modal||state.paused||state.pendingWin)return;const move=E.moves(state.board);if(move){state.hint={...move,at:state.clock};state.selected=null;state.hintsUsed++;checkpoint();}}
    function shuffle(){if(state.modal||state.paused||state.pendingWin)return;state.board=E.reshuffle(state.board);Object.assign(state,{selected:null,hint:null,combo:0,streak:0,neonUntil:0,effects:[],particles:[],history:[],dealAt:state.clock});state.shufflesUsed++;checkpoint();sound('select');}
    function rewind(){
      if(state.modal||state.paused||state.pendingWin||!state.history.length||state.rewindsUsed>=level().rewindLimit)return;
      const s=state.history.pop();Object.assign(state,{board:clone(s.board),score:s.score,removed:s.removed,bends:s.bends,selected:null,hint:null,combo:0,streak:0,neonUntil:0,effects:[],particles:[],dealAt:state.clock});state.rewindsUsed++;checkpoint();sound('select');toast('已倒带');
    }
    function pause(){if(state.modal&&state.modal!=='pause')return;state.paused=!state.paused;state.modal=state.paused?'pause':null;checkpoint();syncMusic();}
    function openMap(){mapAct=level().act;state.modal='map';checkpoint();}
    function time(v=state.elapsed){return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(Math.floor(v%60)).padStart(2,'0')}`;}
    function tile(type,x,y,s,selected,highlight,hovered,angle=0,alpha=1){
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+s/2,y+s/2);if(angle)ctx.rotate(angle);
      const age=state.clock-(state.selected?.at||0),spring=state.motion?1-Math.exp(-age*15)*Math.cos(age*23):1;
      const lift=selected?-3*spring:hovered?-2:0;ctx.translate(0,lift);if(selected&&state.motion){const squash=Math.exp(-age*10)*Math.sin(age*25);ctx.scale(1+.065*squash,1-.075*squash);}
      rect(-s/2,-s/2+4,s,s,Math.min(18,s*.27),'#cfbfae');
      ctx.save();ctx.shadowColor='#87695130';ctx.shadowBlur=10;ctx.shadowOffsetY=4;
      const fill=ctx.createLinearGradient(0,-s/2,0,s/2);fill.addColorStop(0,selected?'#e6edce':'#fff5e5');fill.addColorStop(1,selected?'#cedcb7':'#e5d4bd');
      rect(-s/2,-s/2,s,s,Math.min(18,s*.27),fill,selected?'#86a07b':'#f8ebd7');ctx.restore();
      Art.prop(ctx,type,-s*.50,-s*.53,s*1.02);
      if(state.labels&&s>=38)text(Art.props[type-1].name,0,s*.41,Math.max(6,Math.min(9,s*.12)),'#506a53','center',600);
      if(selected||highlight)rect(-s/2-1,-s/2-1,s+2,s+2,12,null,highlight?'#d6ad63':'#4e9a78');
      ctx.restore();
    }
    function partialLine(points,progress,color,width){
      let total=0;for(let i=1;i<points.length;i++)total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);let remaining=total*clamp(progress);const out=[points[0]];
      for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i],len=Math.hypot(q[0]-p[0],q[1]-p[1]);if(remaining>=len){out.push(q);remaining-=len;}else{out.push([p[0]+(q[0]-p[0])*remaining/len,p[1]+(q[1]-p[1])*remaining/len]);break;}}
      line(out,color,width);return out[out.length-1];
    }
    function drawEffects(){
      const now=state.clock;
      for(const e of state.effects){
        const age=now-e.at;if(age>.95)continue;const p=clamp(age/.68),a=point(e.a),b=point(e.b),points=e.path.map(point),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        ctx.save();ctx.globalAlpha=1-clamp((age-.3)/.5);ctx.shadowColor=act().accent;ctx.shadowBlur=state.motion?20:0;
        partialLine(points,age/.18,act().accent,6);const head=partialLine(points,age/.18,'#fff2d6',2);circle(head[0],head[1],3.5,'#fff5df');ctx.restore();
        if(state.motion){
          for(const [pos,sign]of [[a,-1],[b,1]]){const fly=ease((p-.13)/.85),s=layout.size-8;ctx.save();ctx.globalAlpha=1-clamp((p-.3)/.65);tile(e.type,pos[0]-s/2+(mid[0]-pos[0])*fly*.55,pos[1]-s/2-22*Math.sin(p*Math.PI)-fly*10,s*(1-fly*.65),false,false,false,sign*fly*.32,ctx.globalAlpha);ctx.restore();}
          ctx.save();ctx.globalAlpha=(1-p)*.7;circle(a[0],a[1],8+p*30,null,act().accent);circle(b[0],b[1],8+p*30,null,act().secondary);ctx.restore();
        }
        ctx.globalAlpha=1-clamp((age-.35)/.55);text('+'+e.bonus,mid[0],mid[1]-18-ease(age/.8)*32,Math.min(19,layout.size*.4),act().accent,'center',650);ctx.globalAlpha=1;
      }
      state.effects=state.effects.filter(e=>now-e.at<1);
      for(const p of state.particles){if(p.life<=0)continue;const base=point(p);ctx.globalAlpha=p.life;ctx.save();ctx.translate(base[0]+p.ox,base[1]+p.oy);ctx.rotate(p.spin);rect(-p.size,-p.size,p.size*2,p.size*.8,0,p.color);ctx.restore();}ctx.globalAlpha=1;
    }
    function header(){
      const pad=wide?layout.left:22;icon('reel',pad,24,29,act().accent);text('霓虹片场',pad+40,39,wide?20:18,C.paper,'left',650);
      if(wide)text('NEON / CUT',pad+150,40,10,C.muted,'left',500);
      const right=wide?W-layout.left:W-22;
      button('help',right-135,23,38,32,'?',()=>state.modal='help','flat');button('sound',right-89,23,42,32,state.sound?'♪':'静',()=>{state.sound=!state.sound;storage.set('neon-sound',state.sound?'on':'off');},'flat');button('pause-top',right-39,23,39,32,'Ⅱ',pause,'flat');
      line([[pad,wide?83:75],[right,wide?83:75]],C.line);
    }
    function sidebar(){
      const x=layout.left,y=118,w=280,ph=Math.max(270,Math.min(418,H-345));
      text('ORIGINAL HONG KONG STORIES',x,y,9,act().accent,'left',550);
      Art.toyScene(ctx,x,y+24,w,ph,state.motion?state.clock:0);
      
      text('霓虹',x+18,y+ph-58,40,C.paper,'left',600);text('片场',x+18,y+ph-9,40,C.paper,'left',600);
      text('連連看',x+w-16,y+ph+8,12,act().accent,'right',500);
      text('一座城，六十场戏。',x,y+ph+57,15,C.paper,'left',500);
      const startY=y+ph+88;Campaign.acts.forEach((v,i)=>{const yy=startY+i*27;if(yy>H-35)return;const active=i===level().act;circle(x+3,yy,2,active?act().accent:'#526067');text(`${String(i+1).padStart(2,'0')}  ${v.name}`,x+16,yy,11,active?C.paper:C.muted);text(`${i*10+1}—${i*10+10}`,x+w,yy,10,active?act().accent:'#69797b','right');});
    }
    function drawRight(){
      const x=layout.rightX,w=Math.max(140,Math.min(190,W-x-layout.left)),top=211;
      text('本场得分',x,top,11,C.muted);text(String(state.score).padStart(4,'0'),x,top+38,37,act().accent,'left',500,'Georgia,serif');
      line([[x,top+77],[x+w,top+77]],C.line);
      text('放映进度',x,top+107,11,C.muted);text(`${state.removed/2} / ${level().pairs}`,x,top+137,23,C.paper,'left',450);
      for(let i=0;i<level().pairs;i++){const per=Math.ceil(level().pairs/2),row=Math.floor(i/per),col=i%per;rect(x+col*(w/per),top+166+row*9,w/per-3,4,1,i<state.removed/2?act().accent:'#dae3d4');}
      text('用时',x,top+218,11,C.muted);text(time(),x,top+248,23,C.paper,'left',450);
      text(`三星参考  ${time(level().par)}`,x,top+279,10,C.muted);
      text(level().objective.text,x,top+298,9,act().secondary);
      line([[x,top+312],[x+w,top+312]],C.line);
      const neon=state.clock<state.neonUntil;
      text(neon?'霓虹时刻 ×2':'一镜到底',x,top+342,13,neon?act().accent:C.paper,'left',600);
      for(let i=0;i<5;i++)rect(x+i*(w/5),top+367,w/5-5,5,2,neon||i<state.streak?act().accent:'#dae3d4');
      if(state.combo>1&&state.clock-state.lastMatch<5.5)text(`连击 ×${state.combo}`,x,top+394,12,act().secondary);
      else text('连续 5 对，开启双倍得分',x,top+394,10,C.muted);
      button('map',x,Math.min(H-100,top+440),w,40,'选关  /  60',openMap,'outline');
    }
    function render(dt){
      ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);hits=[];
      ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);

      const glow=ctx.createRadialGradient(W*.53,H*.48,10,W*.53,H*.48,Math.max(W,H)*.6);glow.addColorStop(0,'#d9e9d455');glow.addColorStop(1,'#f6f3eb00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
      // Fine scan lines, restrained rain and two-colour edge light.
      ctx.globalAlpha=.055;for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);ctx.globalAlpha=1;
      if(state.clock<state.neonUntil){ctx.save();ctx.globalAlpha=.25+.12*Math.sin(state.clock*3);line([[1,0],[1,H]],act().accent,3);line([[W-1,0],[W-1,H]],act().secondary,3);ctx.restore();}
      if(state.screen==='home'){drawHome();if(state.modal)drawModal();return;}
      header();if(wide){sidebar();drawRight();}
      const {x,y,size,bw,bh,areaX,areaW}=layout,l=level();
      text(`${String(l.number).padStart(2,'0')} / 60  ·  ${act().name}`,areaX,wide?120:layout.compact?88:101,10,act().accent,'left',500);
      text(l.name,areaX,wide?153:layout.compact?112:131,wide?26:23,C.paper,'left',600);
      if(wide){button('map-inline',areaX+areaW-84,127,84,30,'选择场次 ↗',openMap,'flat');text(`${l.pairs} 对 · ${l.types} 种道具`,areaX,181,11,C.muted);}
      else{
        button('map',W-106,layout.compact?84:87,84,30,'选关 / 60',openMap,'flat');
        const sy=layout.compact?137:163;text(`${state.score} 分`,areaX,sy,12,act().accent);text(`${state.removed/2} / ${l.pairs}`,W/2,sy,12,C.muted,'center');text(time(),W-22,sy,12,C.muted,'right');
      }
      rect(x-16,y-11,bw+32,bh+31,22,'#bdccb960');rect(x-16,y-16,bw+32,bh+31,22,'#dfe8d4','#f8fcf0');rect(x-7,y-7,bw+14,bh+16,16,'#e7eadb');
      // Film perforations frame the playfield instead of ornamental prose.
      for(let i=0;i<Math.floor(bw/20);i++){rect(x+i*20+3,y-12,8,3,1,'#93ad8945');rect(x+i*20+3,y+bh+10,8,3,1,'#93ad8945');}
      for(let r=0;r<l.rows;r++)for(let c=0;c<l.cols;c++){
        const tx=x+c*size+4,ty=y+r*size+4,s=size-8,v=state.board[r][c];
        if(!v){rect(tx+2,ty+2,s-4,s-4,7,'#dae2d2');if(Boards[state.level].board[r][c])circle(tx+s/2,ty+s/2,1.2,'#87a28044');continue;}
        const selected=state.selected?.r===r&&state.selected?.c===c,hl=state.hint&&[state.hint.a,state.hint.b].some(p=>p.r===r&&p.c===c),id=`tile-${r}-${c}`;
        let offset=0,scale=1,alpha=1;
        if(state.motion){const deal=clamp((state.clock-state.dealAt-(r*l.cols+c)*.009)/.34);offset=(1-ease(deal))*12;scale=.91+ease(deal)*.09;alpha=.15+deal*.85;}
        if(state.motion&&state.shake&&state.clock-state.shake.at<.32&&[state.shake.a,state.shake.b].some(p=>p.r===r&&p.c===c))offset+=Math.sin((state.clock-state.shake.at)*65)*4;
        tile(v,tx+s*(1-scale)/2,ty+offset+s*(1-scale)/2,s*scale,selected,hl,hover===id,0,alpha);
        hits.push({id,x:tx,y:ty,w:s,h:s,fn:()=>actTile(r,c)});
      }
      if(state.hint&&state.clock-state.hint.at<4){ctx.save();ctx.globalAlpha=.35+.15*Math.sin(state.clock*5);line(state.hint.path.map(point),act().secondary,2);ctx.restore();}
      if(drag?.moved&&state.selected){ctx.save();ctx.globalAlpha=.6;ctx.setLineDash?.([4,5]);line([point(state.selected),[drag.x,drag.y]],act().secondary,2);ctx.restore();}
      if(!state.paused&&!state.modal){for(const p of state.particles){p.ox+=p.vx*dt;p.oy+=p.vy*dt;p.vy+=100*dt;p.spin+=dt*3;p.life-=dt*1.7;}}state.particles=state.particles.filter(p=>p.life>0);drawEffects();
      const by=y+bh+(layout.compact?24:37),gap=8,btnW=(areaW-gap*3)/4;
      button('hint',areaX,by,btnW,43,'提示',hint,'primary',!!state.pendingWin);button('rewind',areaX+btnW+gap,by,btnW,43,`倒带 ${2-state.rewindsUsed}`,rewind,'outline',!state.history.length||state.rewindsUsed>=2||!!state.pendingWin);button('shuffle',areaX+(btnW+gap)*2,by,btnW,43,'换位',shuffle,'outline',!!state.pendingWin);button('pause',areaX+(btnW+gap)*3,by,btnW,43,'暂停',pause);
      if(!wide){
        const neon=state.clock<state.neonUntil;for(let i=0;i<5;i++)rect(W/2-50+i*21,by+(layout.compact?56:63),16,3,1,neon||i<state.streak?act().accent:'#dae3d4');
        text(neon?'霓虹时刻 ×2':state.combo>1&&state.clock-state.lastMatch<5.5?`一镜到底 ×${state.combo}`:state.level<3?'相同道具相连，最多转两次弯':`镜头任务：${l.objective.text}`,W/2,by+(layout.compact?76:85),10,neon?act().accent:C.muted,'center');
      }else text('相同道具相连 · 最多转两次弯',areaX+areaW/2,by+68,10,C.muted,'center');
      if(state.toast&&state.uiTime<state.toastUntil&&!state.modal){const tw=200;rect((W-tw)/2,Math.min(H-58,by+103),tw,34,8,'#e2ebd5');text(state.toast,W/2,Math.min(H-41,by+120),12,C.ink,'center');}
      if(state.modal)drawModal();
    }
    function wrap(s,x,y,width,size=13,color=C.paper,leading=25){const chars=Math.max(8,Math.floor(width/size));let row=0;for(let i=0;i<s.length;i+=chars)text(s.slice(i,i+chars),x,y+row++*leading,size,color);return row*leading;}
    function drawHome(){
      const x=wide?W/2+42:30,w=wide?340:W-60,titleY=wide?H*.20:49;
      if(wide)Art.toyScene(ctx,W/2-500,H*.13,460,Math.min(530,H-240),state.motion?state.uiTime:0);
      else Art.toyScene(ctx,18,148,W-36,Math.max(130,Math.min(325,H-477)),state.motion?state.uiTime:0);
      text('NEON / CUT',x,titleY,10,'#69937a','left',600);
      text('霓虹片场',x,titleY+(wide?53:47),wide?47:37,C.paper,'left',650);
      text('软陶小物连连看 · 六幕六十场',x,titleY+(wide?99:81),12,C.muted);
      const by=wide?titleY+167:H-301,totalStars=Object.values(state.records).reduce((s,r)=>s+r.stars,0);
      text(`已完成 ${Object.keys(state.records).length}/60  ·  ${totalStars} 星`,x,by-25,11,C.muted);
      button('continue',x,by,w,49,`${state.removed?'继续':'开始'}放映  /  第 ${state.level+1} 场`,continueGame,'primary');
      button('home-map',x,by+63,(w-10)/2,42,'章节选关',openMap);button('collection',x+(w+10)/2,by+63,(w-10)/2,42,'旧物与胶片',()=>state.modal='collection');
      button('daily',x,by+116,(w-10)/2,42,state.daily[Meta.dateKey()]?.completed?'今日已放映':'每日放映',()=>{if(state.removed)state.modal={type:'daily'};else startDaily();});button('achievements',x+(w+10)/2,by+116,(w-10)/2,42,'成就手册',()=>{state.achievementPage=0;state.modal='achievements';});
      button('settings',x,by+169,w,38,'设置与存档',()=>state.modal='settings','flat');
      text('离线单机  ·  v0.4.1',x,Math.min(H-24,by+239),10,C.muted);
    }
    function exportData(){checkpoint();return {format:'neon-cut-save',version:1,progress:json('neon-progress-v2'),checkpoint:json('neon-checkpoint-v2'),settings:json('neon-settings-v3'),sound:state.sound};}
    function importData(data){
      if(typeof data==='string')data=JSON.parse(data);
      if(data?.format!=='neon-cut-save'||data.version!==1||!Meta.validProgress(data.progress))throw Error('存档格式不正确');
      if(data.checkpoint&&!validSave(data.checkpoint,data.progress.unlocked))throw Error('棋盘记录不正确');
      if(data.settings!==null&&data.settings!==undefined&&(typeof data.settings!=='object'||Array.isArray(data.settings)))throw Error('设置记录不正确');
      const records=data.progress.records||{};for(const [key,r]of Object.entries(records))if(!/^\d+$/.test(key)||Number(key)>59||!r||![1,2,3].includes(r.stars)||!Number.isFinite(r.score)||r.score<0||!Number.isFinite(r.time)||r.time<0)throw Error('关卡记录不正确');
      const p=data.progress;state.unlocked=p.unlocked;state.records=records;state.stats={props:{},bends:0,maxCombo:0,...p.stats};state.daily=p.daily||{};state.storySeen=p.storySeen||{};
      if(data.settings){state.motion=data.settings.motion!==false;state.music=data.settings.music!==false;state.haptics=data.settings.haptics!==false;state.labels=!!data.settings.labels;}state.sound=data.sound!==false;
      const s=data.checkpoint;startLevel(validSave(s)?s.level:state.unlocked);
      if(validSave(s)){for(const k of ['board','score','removed','bends','bestCombo','elapsed','rewindsUsed','hintsUsed','shufflesUsed','history','dailyChallenge'])if(s[k]!==undefined)state[k]=s[k];}
      saveProgress();saveSettings();checkpoint();state.screen='home';state.modal=null;toast('存档已导入');
    }
    function downloadSave(){const data=JSON.stringify(exportData());if(!wxapi&&window.NeonHost?.saveBackup){window.NeonHost.saveBackup(data);return;}if(!wxapi){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.href=url;a.download='neon-cut-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('存档已导出');}else toast('当前平台暂不支持文件导出');}
    function uploadSave(){if(!wxapi&&window.NeonHost?.openBackup){window.NeonHost.openBackup();return;}if(!wxapi){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const f=input.files[0];if(!f||f.size>1048576)throw Error('文件过大');importData(await f.text());}catch(e){toast('无法读取存档');}};input.click();}else toast('当前平台暂不支持文件导入');}
    function modalFrame(w,h){const x=(W-w)/2,y=(H-h)/2;ctx.fillStyle='#31594b66';ctx.fillRect(0,0,W,H);rect(x,y,w,h,18,'#fffdf8','#d9dfd1');rect(x+20,y+1,w-40,2,1,act().accent);return {x,y,w,h,mid:W/2};}
    function drawModal(){
      hits=[];const m=state.modal;
      if(m==='story'){
        const {x,y,w,mid}=modalFrame(Math.min(430,W-30),365),s=Meta.stories[level().act];text(`第 ${level().act+1} 幕 · ${act().name}`,x+23,y+35,11,act().accent);text(s.title,x+23,y+78,21,C.paper,'left',600);let yy=y+128;for(const v of s.lines)yy+=wrap(v,x+23,yy,w-46,12,C.muted,23)+15;
        button('story-start',x+23,y+299,w-46,42,'开拍',()=>{state.storySeen[level().act]=true;saveProgress();state.modal=null;},'primary');
      }else if(m==='settings'){
        const {x,y,w,h,mid}=modalFrame(Math.min(410,W-28),Math.min(600,H-28));text('设置与存档',x+24,y+37,22,C.paper,'left',600);
        const items=[['setting-music','背景音乐',state.music,()=>state.music=!state.music],['setting-sound','音效',state.sound,()=>state.sound=!state.sound],['setting-motion','动态效果',state.motion,()=>state.motion=!state.motion],['setting-haptics','振动反馈',state.haptics,()=>state.haptics=!state.haptics],['setting-labels','道具名称',state.labels,()=>state.labels=!state.labels]];
        items.forEach(([id,label,on,fn],i)=>{text(label,x+25,y+95+i*50,13,C.paper);button(id,x+w-108,y+77+i*50,83,34,on?'开启':'关闭',()=>{fn();saveSettings();},on?'primary':'outline');});
        button('export-save',x+24,y+341,(w-58)/2,39,'导出存档',downloadSave);button('import-save',x+34+(w-58)/2,y+341,(w-58)/2,39,'导入存档',uploadSave);button('privacy',x+24,y+393,w-48,36,'隐私说明与版本',()=>state.modal='privacy','flat');button('reset-save',x+24,y+441,w-48,35,'清空游戏进度',()=>state.modal={type:'reset-save'},'flat');button('close',x+24,y+h-65,w-48,42,'返回',()=>state.modal=null);
      }else if(m==='privacy'){
        const {x,y,w,mid}=modalFrame(Math.min(410,W-28),405);text('隐私与版本',x+24,y+38,22,C.paper,'left',600);let yy=y+92;for(const s of ['霓虹片场 v0.4.1 · 离线单机测试版','进度与设置仅保存在本机。没有账号、广告、支付或第三方统计，不上传游戏数据。','卸载或清除应用数据可能丢失进度，建议先导出存档。导入与导出文件由你选择位置。','本作的街景、故事与道具绘制为原创，不使用电影人物或影片素材。'])yy+=wrap(s,x+24,yy,w-48,12,C.muted,22)+15;
        button('privacy-back',x+24,y+339,w-48,42,'返回设置',()=>state.modal='settings');
      }else if(m==='achievements'){
        const {x,y,w,h,mid}=modalFrame(Math.min(440,W-28),Math.min(560,H-28)),earned=Meta.earned(state),page=state.achievementPage||0; text('成就手册',x+23,y+35,22,C.paper,'left',600);text(`${earned.length} / ${Meta.achievements.length}`,x+w-23,y+36,12,act().accent,'right');
        Meta.achievements.slice(page*5,page*5+5).forEach((a,i)=>{const yy=y+78+i*72,on=earned.includes(a.id);rect(x+22,yy,w-44,60,8,on?'#deeadb':'#efede2',on?'#8a9d79':C.line);star(x+44,yy+30,10,on?act().accent:'#b6c6b3');text(a.title,x+66,yy+21,14,on?C.paper:C.muted,'left',500);text(a.desc,x+66,yy+43,10,C.muted);});
        button('achievement-page',x+23,y+h-105,w-46,33,page?'上一页':'下一页',()=>state.achievementPage=page?0:1,'flat');button('close',x+23,y+h-58,w-46,38,'返回',()=>state.modal=null);
      }else if(m==='collection'){
        const {x,y,w,h,mid}=modalFrame(Math.min(530,W-28),Math.min(665,H-24)),tab=state.collectionTab||0; text('旧物与胶片',x+23,y+35,22,C.paper,'left',600);button('props-tab',x+22,y+66,(w-54)/2,34,'旧物 / 12',()=>state.collectionTab=0,tab===0?'primary':'outline');button('reels-tab',x+32+(w-54)/2,y+66,(w-54)/2,34,'故事 / 6',()=>state.collectionTab=1,tab===1?'primary':'outline');
        if(tab===0){const cw=(w-60)/3,ch=Math.min(88,(h-285)/4);Art.props.forEach((p,i)=>{const xx=x+22+i%3*(cw+8),yy=y+119+Math.floor(i/3)*(ch+8),known=!!state.stats.props[i+1];rect(xx,yy,cw,ch,8,i===state.selectedProp?'#dcebdc':'#efede2',i===state.selectedProp?act().accent:C.line);if(known)Art.prop(ctx,i+1,xx+cw/2-ch*.37,yy,ch*.74);else text('?',xx+cw/2,yy+ch*.4,23,'#8fa38d','center');text(known?p.name:'未发现',xx+cw/2,yy+ch-10,9,known?C.paper:C.muted,'center');hits.push({id:'prop-'+i,x:xx,y:yy,w:cw,h:ch,fn:()=>state.selectedProp=i});});
          const yy=y+119+4*(ch+8)+15,known=!!state.stats.props[state.selectedProp+1];text(known?Art.props[state.selectedProp].name:'尚未发现',x+24,yy,15,act().accent);wrap(known?Meta.propNotes[state.selectedProp]:'在关卡中完成配对，收录这件旧物。',x+24,yy+28,w-48,12,C.muted,22);
        }else{const cw=(w-54)/3;Meta.stories.forEach((s,i)=>{const xx=x+22+i%3*(cw+5),yy=y+122+Math.floor(i/3)*109,on=!!state.records[i*10+9];rect(xx,yy,cw,96,8,on?'#deeadb':'#efede2',C.line);icon('reel',xx+cw/2-14,yy+15,28,on?Campaign.acts[i].accent:'#a2b49b');text(Campaign.acts[i].name,xx+cw/2,yy+64,11,on?C.paper:C.muted,'center');text(on?'已修复':'待修复',xx+cw/2,yy+82,9,C.muted,'center');hits.push({id:'reel-'+i,x:xx,y:yy,w:cw,h:96,fn:()=>{state.galleryAct=i;state.modal='reel-story';}});});text('完成每幕 10 场，修复一卷胶片。',mid,y+370,11,C.muted,'center');}
        button('close',x+22,y+h-58,w-44,39,'返回',()=>state.modal=null);
      }else if(m==='reel-story'){
        const {x,y,w,h,mid}=modalFrame(Math.min(430,W-28),425),i=state.galleryAct,s=Meta.stories[i],on=!!state.records[i*10+9];text(Campaign.acts[i].name,x+23,y+34,11,Campaign.acts[i].accent);text(s.title,x+23,y+78,21,C.paper,'left',600);let yy=y+128;if(state.unlocked>=i*10){for(const v of s.lines)yy+=wrap(v,x+23,yy,w-46,12,C.muted,22)+12;yy+=12;wrap(on?s.ending:'完成本幕，解锁故事的结尾。',x+23,yy,w-46,12,on?act().accent:C.muted,22);}else text('完成上一幕，开始这段故事。',x+23,yy,12,C.muted);button('story-back',x+23,y+h-64,w-46,42,'返回收藏',()=>state.modal='collection');
      }else if(m==='map'){
        const f=modalFrame(Math.min(590,W-28),Math.min(545,H-28)),{x,y,w,mid}=f;
        text('场次选择',x+23,y+34,22,C.paper,'left',600);text('60 场 · 6 幕',x+w-23,y+34,11,C.muted,'right');
        const tw=(w-58)/3;Campaign.acts.forEach((v,i)=>{const xx=x+20+(i%3)*(tw+9),yy=y+67+Math.floor(i/3)*44;button('act-'+i,xx,yy,tw,35,v.name,()=>mapAct=i,i===mapAct?'primary':'flat');});
        text(Campaign.acts[mapAct].en,x+22,y+179,10,Campaign.acts[mapAct].accent,'left',500);
        const gap=8,cw=(w-44-4*gap)/5,ch=Math.min(88,cw*1.35),gridY=y+203;
        for(let i=0;i<10;i++){
          const id=mapAct*10+i,xx=x+22+(i%5)*(cw+gap),yy=gridY+Math.floor(i/5)*(ch+12),locked=id>state.unlocked,record=state.records[id];
          rect(xx,yy,cw,ch,8,id===state.level?'#d9e9d8':'#efede2',id===state.level?Campaign.acts[mapAct].accent:C.line);text(String(id+1).padStart(2,'0'),xx+cw/2,yy+ch*.36,20,locked?'#627479':C.paper,'center',500,'Georgia,serif');
          if(record){for(let k=0;k<3;k++)star(xx+cw/2+(k-1)*12,yy+ch*.72,4.3,k<record.stars?act().accent:'#d5dccc');}else text(locked?'未解锁':id===state.unlocked?'开始':'重玩',xx+cw/2,yy+ch*.73,9,locked?'#627479':C.muted,'center');
          hits.push({id:'level-'+id,x:xx,y:yy,w:cw,h:ch,fn:()=>{if(locked){toast('先完成前一场');return;}if(id===state.level){continueGame();return;}state.modal={type:'level',id};}});
        }
        const fy=gridY+ch*2+29;text(`${Campaign.acts[mapAct].genre} · 第 ${mapAct*10+1}—${mapAct*10+10} 关`,mid,fy+8,11,C.muted,'center');
        button('close',x+22,y+f.h-61,w-44,39,'返回',()=>state.modal=null,'outline');
      }else if(m==='win'){
        const {x,y,w,mid}=modalFrame(Math.min(382,W-32),397);
        text('CUT. 这一幕，漂亮。',mid,y+43,24,C.paper,'center',600);
        for(let i=0;i<3;i++){const t=state.motion?clamp((state.uiTime-state.winAtUi-i*.13)/.45):1;const scale=ease(t);ctx.save();ctx.globalAlpha=.25+scale*.75;star(mid+(i-1)*53,y+106+14*(1-scale),19*(.65+scale*.35),i<state.result.stars?act().accent:'#d5dccc');ctx.restore();}
        text(`${state.score} 分`,mid,y+166,36,act().accent,'center',500,'Georgia,serif');text(`${time()}  ·  最佳 ${state.records[state.level].score}`,mid,y+206,12,C.muted,'center');
        const missing=[];if(state.elapsed>level().par)missing.push(`${time(level().par)} 内完成`);if(!Campaign.objectiveMet(level(),state))missing.push(level().objective.text);text(missing.length?'再拿一星：'+missing[0]:'三星收录',mid,y+238,11,C.muted,'center');
        button('next',x+24,y+276,w-48,43,state.level<59?'下一场 →':'60 场完成 · 重映',()=>startLevel(Math.min(59,state.level+1)),'primary');button('replay',x+24,y+334,(w-58)/2,38,'重映本场',()=>startLevel(state.level));button('win-map',x+34+(w-58)/2,y+334,(w-58)/2,38,'选择场次',openMap);
      }else if(m==='help'){
        const {x,y,w,mid}=modalFrame(Math.min(390,W-32),365);
        text('三秒开场',mid,y+38,23,C.paper,'center',600);Art.prop(ctx,1,mid-68,y+64,53);Art.prop(ctx,1,mid+15,y+64,53);line([[mid-9,y+91],[mid+9,y+91]],act().accent,2);
        text('相同道具配对，路线最多转两次弯。',mid,y+145,12,C.paper,'center');text('不能穿过道具，可以绕棋盘外侧。',mid,y+177,12,C.muted,'center');text('连消 5 对 → 双倍得分 7 秒。',mid,y+215,12,act().accent,'center');text('倒带可撤回一对，每场 2 次。',mid,y+246,12,C.muted,'center');
        button('close',x+24,y+291,w-48,43,'开拍',()=>state.modal=null,'primary');
      }else if(typeof m==='object'&&m.type==='reset-save'){
        const {x,y,w,mid}=modalFrame(Math.min(350,W-32),282);text('清空全部进度？',mid,y+49,22,C.paper,'center',600);text('关卡、收藏与成就都会清除。',mid,y+94,12,C.muted,'center');button('confirm',x+24,y+143,w-48,42,'确认清空',()=>{state.unlocked=0;state.records={};state.stats={props:{},bends:0,maxCombo:0};state.daily={};state.storySeen={};storage.remove('neon-checkpoint-v2');startLevel(0);home();},'primary');button('cancel',x+24,y+209,w-48,39,'返回',()=>state.modal='settings');
      }else if(typeof m==='object'&&m.type==='daily'){
        const {x,y,w,mid}=modalFrame(Math.min(350,W-32),260);text('进入每日放映？',mid,y+49,22,C.paper,'center',600);text('本场未完成的棋盘会重新开始。',mid,y+92,12,C.muted,'center');button('confirm',x+24,y+135,w-48,42,'进入',startDaily,'primary');button('cancel',x+24,y+194,w-48,39,'返回',()=>state.modal=null);
      }else if(typeof m==='object'){
        const {x,y,w,mid}=modalFrame(Math.min(350,W-32),260);text(m.type==='level'?'切换场次？':'重新开拍？',mid,y+47,23,C.paper,'center',600);text('本场进度会重置。',mid,y+91,12,C.muted,'center');button('confirm',x+24,y+132,w-48,41,'确认',()=>startLevel(m.id??state.level),'primary');button('cancel',x+24,y+190,w-48,39,'返回',()=>state.modal=null);
      }else{
        const {x,y,w,mid}=modalFrame(Math.min(350,W-32),310);text('暂停放映',mid,y+46,24,C.paper,'center',600);text(`第 ${state.level+1} 场 · ${time()}`,mid,y+87,12,C.muted,'center');
        button('resume',x+24,y+124,w-48,43,'继续',()=>{state.paused=false;state.modal=null;},'primary');button('restart',x+24,y+182,(w-58)/2,39,'重开本场',()=>{state.paused=false;state.modal={type:'restart'};});button('motion',x+34+(w-58)/2,y+182,(w-58)/2,39,'设置',()=>{state.paused=false;state.modal='settings';});button('pause-map',x+24,y+236,w-48,39,'返回片场',home);
      }
      if(state.toast&&state.uiTime<state.toastUntil){rect(W/2-90,H/2-18,180,36,8,'#e2ebd5');text(state.toast,W/2,H/2,12,C.ink,'center');}
    }
    function tick(){
      if(disposed)return;const now=Date.now(),dt=Math.min(Math.max(0,(now-last)/1000),.05);last=now;state.uiTime+=dt;
      if(state.screen==='play'&&!state.paused&&!state.modal){state.clock+=dt;state.elapsed+=dt;if(state.clock-state.lastMatch>5.5){state.combo=0;state.streak=0;}if(state.pendingWin&&state.clock>=state.pendingWin)finish();}
      render(dt);frame=(wxapi?requestAnimationFrame:window.requestAnimationFrame)(tick);
    }
    function hitAt(px,py){return hits.slice().reverse().find(h=>px>=h.x&&px<=h.x+h.w&&py>=h.y&&py<=h.y+h.h);}
    function pointer(px,py){const hit=hitAt(px,py);drag=hit?.id.startsWith('tile-')?{id:hit.id,x:px,y:py,startX:px,startY:py,moved:false}:null;if(hit)hit.fn();if(!state.selected)drag=null;syncMusic();}
    function dragMove(x,y){if(drag){drag.x=x;drag.y=y;drag.moved=drag.moved||Math.hypot(x-drag.startX,y-drag.startY)>8;}}
    function dragEnd(x,y){if(drag?.moved){const hit=hitAt(x,y);if(hit?.id.startsWith('tile-')&&hit.id!==drag.id)hit.fn();}drag=null;}
    function close(){if(state.modal){state.modal=null;state.paused=false;}}
    function back(){if(state.modal==='win'){home();return;}if(state.modal){close();return;}if(state.screen==='play')pause();else state.modal='settings';}
    function key(e){if(e.repeat)return;const k=e.code;if(k==='Space'&&state.screen==='play'){e.preventDefault();pause();}if(state.screen==='play'){if(k==='KeyH')hint();if(k==='KeyR')shuffle();if(k==='KeyZ')rewind();}if(k==='Escape')back();}
    function onHide(){drag=null;checkpoint();musicPlayer?.pause();if(state.screen==='play'&&!state.modal){state.paused=true;state.modal='pause';}}
    if(wxapi){wxapi.onTouchStart(e=>{const p=e.touches[0];if(p)pointer(p.clientX,p.clientY);});wxapi.onTouchMove?.(e=>{const p=e.touches[0];if(p)dragMove(p.clientX,p.clientY);});wxapi.onTouchEnd?.(e=>{const p=e.changedTouches[0];if(p)dragEnd(p.clientX,p.clientY);});wxapi.onWindowResize(resize);wxapi.onHide(onHide);}
    else{
      const onPointer=e=>{const b=canvas.getBoundingClientRect();pointer((e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height);};
      const onMove=e=>{const b=canvas.getBoundingClientRect();mouse={x:e.clientX-b.left,y:e.clientY-b.top};dragMove(mouse.x,mouse.y);const hit=hitAt(mouse.x,mouse.y);hover=hit?.id;canvas.style.cursor=hit?'pointer':'default';};
      const onEnd=e=>{const b=canvas.getBoundingClientRect();dragEnd(e.clientX-b.left,e.clientY-b.top);};const onCancel=()=>drag=null;
      const visibility=()=>{if(document.hidden)onHide();};
      for(const [target,name,fn]of [[window,'resize',resize],[canvas,'pointerdown',onPointer],[canvas,'pointermove',onMove],[window,'pointerup',onEnd],[window,'pointercancel',onCancel],[window,'keydown',key],[document,'visibilitychange',visibility],[window,'pagehide',checkpoint]]){target.addEventListener(name,fn);cleanup.push(()=>target.removeEventListener(name,fn));}
    }
    const saved=json('neon-checkpoint-v2');
    state.level=validSave(saved)?saved.level:state.unlocked;resetFields();
    if(validSave(saved)){for(const k of ['board','score','removed','bends','bestCombo','elapsed','rewindsUsed','hintsUsed','shufflesUsed','history','dailyChallenge'])if(saved[k]!==undefined)state[k]=saved[k];}
    else state.board=clone(Boards[state.level].board);
    mapAct=level().act;resize();tick();
    return {state,get layout(){return layout;},get buttons(){return hits.map(({fn,...h})=>h);},startLevel,actTile,checkpoint,home,back,background:onHide,exportData,importData,destroy(){disposed=true;cleanup.forEach(fn=>fn());if(!wxapi)cancelAnimationFrame(frame);musicPlayer?.pause();musicPlayer?.destroy?.();audioContext?.close();}};
  }
  return {mount};
});
