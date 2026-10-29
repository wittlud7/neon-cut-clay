const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const E=require('../src/engine'),{levels}=require('../src/campaign');
function setup(initial){
 let clock=10000,frame,touch;const saved=new Map(initial||[]),gradient={addColorStop(){}};
 const ctx=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
 const canvas={getContext:()=>ctx};
 const wx={createCanvas:()=>canvas,getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:1}),getStorageSync:k=>saved.get(k),setStorageSync:(k,v)=>saved.set(k,v),removeStorageSync:k=>saved.delete(k),onTouchStart:fn=>touch=fn,onWindowResize(){},onHide(){},vibrateShort(){}};
 class Clock extends Date{static now(){return clock;}}
 const env={wx,Date:Clock,Math,console,requestAnimationFrame:fn=>frame=fn},cache=new Map();let game;
 function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),{...env,module,exports:module.exports,require:n=>load(path.resolve(path.dirname(file),n+'.js'))},{filename:file});cache.set(file,module.exports);if(file.endsWith(path.join('src','game.js'))){const mount=module.exports.mount;module.exports.mount=(...args)=>(game=mount(...args));}return module.exports;}
 load(path.join(__dirname,'../game.js'));
 game.state.screen='play';
 const tick=(n=1)=>{for(let i=0;i<n;i++){clock+=50;frame();}};
 function click(id){tick();const b=game.buttons.find(b=>b.id===id);assert.ok(b,'Button '+id);touch({touches:[{clientX:b.x+b.w/2,clientY:b.y+b.h/2}]});tick();}
 const pair=()=>{const m=E.moves(game.state.board);assert.ok(m);game.actTile(m.a.r,m.a.c);game.actTile(m.b.r,m.b.c);tick();};
 return {game,saved,tick,click,pair};
}
test('all 60 levels finish through actual matching, save records and unlock consecutively',()=>{
 const {game,saved,tick,pair}=setup();game.state.motion=false;
 for(let id=0;id<60;id++){
  game.startLevel(id);tick();for(let i=0;i<levels[id].pairs;i++)pair();tick(4);
  assert.equal(game.state.modal,'win','Level '+(id+1));assert.equal(game.state.removed,levels[id].pairs*2);assert.ok(game.state.records[id].stars>=1);assert.ok(game.state.unlocked>=Math.min(id+1,59));
 }
 const progress=JSON.parse(saved.get('neon-progress-v2'));assert.equal(Object.keys(progress.records).length,60);assert.equal(progress.unlocked,59);assert.ok(!saved.has('neon-checkpoint-v2'));
});
test('undo restores exact tiles and score, is limited to two, shuffle invalidates history',()=>{
 const {game,tick,click,pair}=setup();const before=JSON.stringify(game.state.board);pair();assert.equal(game.state.removed,2);click('rewind');assert.equal(JSON.stringify(game.state.board),before);assert.equal(game.state.score,0);assert.equal(game.state.rewindsUsed,1);
 pair();click('rewind');pair();assert.equal(game.state.rewindsUsed,2);assert.ok(!game.buttons.some(b=>b.id==='rewind'));click('shuffle');assert.equal(game.state.history.length,0);assert.ok(E.moves(game.state.board));
 click('pause');const elapsed=game.state.elapsed;tick(30);assert.equal(game.state.elapsed,elapsed);click('resume');tick();assert.ok(game.state.elapsed>elapsed);
});
test('consecutive matches activate neon, valid quick input is not blocked by visual effects',()=>{
 const {game,tick,pair}=setup();for(let i=0;i<5;i++)pair();assert.ok(game.state.neonUntil>game.state.clock);assert.equal(game.state.combo,5);assert.equal(game.state.effects.length,5);assert.equal(game.state.removed,10);assert.ok(game.state.score>600);
 const expiry=game.state.clock;game.state.modal='help';tick(60);assert.equal(game.state.clock,expiry);game.state.modal=null;tick(150);assert.ok(game.state.neonUntil<=game.state.clock);assert.equal(game.state.combo,0);
});
test('partial game resumes with correct level, tiles, score and elapsed time',()=>{
 const first=setup();first.pair();first.tick(10);first.game.checkpoint();const before=first.game.state;
 const next=setup(first.saved);assert.equal(next.game.state.level,before.level);assert.equal(JSON.stringify(next.game.state.board),JSON.stringify(before.board));assert.equal(next.game.state.score,before.score);assert.equal(next.game.state.removed,before.removed);assert.ok(Math.abs(next.game.state.elapsed-before.elapsed)<.1);
});
test('backup round-trip preserves progress and rejects damaged input atomically',()=>{
 const a=setup();a.pair();const data=a.game.exportData();const b=setup();b.game.importData(JSON.stringify(data));assert.equal(JSON.stringify(b.game.state.board),JSON.stringify(a.game.state.board));assert.equal(b.game.state.score,a.game.state.score);assert.equal(b.game.state.screen,'home');
 const before=JSON.stringify(b.game.exportData()),bad=JSON.parse(JSON.stringify(data));bad.progress.stats.props=null;assert.throws(()=>b.game.importData(bad));assert.equal(JSON.stringify(b.game.exportData()),before);
 const badBoard=JSON.parse(JSON.stringify(data));badBoard.checkpoint.board[0][0]=99;assert.throws(()=>b.game.importData(badBoard));assert.equal(JSON.stringify(b.game.exportData()),before);
});
test('completion returns to a playable next scene, collection and achievements persist',()=>{
 const a=setup();for(let i=0;i<8;i++)a.pair();a.tick(20);assert.equal(a.game.state.modal,'win');assert.ok(Object.keys(a.game.state.stats.props).length>=4);a.game.home();assert.equal(a.game.state.level,1);assert.equal(a.game.state.screen,'home');assert.equal(a.game.state.removed,0);assert.ok(E.moves(a.game.state.board));
 const b=setup(a.saved);assert.equal(b.game.state.records[0].stars,3);assert.ok(b.game.state.stats.props[1]);
});
test('daily screening records its own date and survives save restore',()=>{
 const a=setup();a.game.home();a.click('daily');const date=a.game.state.dailyChallenge;assert.match(date,/^\d{4}-\d{2}-\d{2}$/);for(let i=0;i<8;i++)a.pair();a.tick(20);assert.equal(a.game.state.daily[date].completed,true);assert.ok(a.game.state.daily[date].score>0);a.game.home();const b=setup(a.saved);assert.equal(b.game.state.daily[date].completed,true);
});
