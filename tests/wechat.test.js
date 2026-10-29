const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
test('WeChat entry starts without DOM, draws and responds to touch',()=>{
  let touch,raf,resize,hide,draws=0;
  const gradient={addColorStop(){}};
  const ctx=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(obj,key)=>key in obj?obj[key]:(...args)=>{draws++;},set:(obj,key,v)=>{obj[key]=v;return true;}});
  const canvas={getContext:()=>ctx};const saved=new Map();
  const wx={createCanvas:()=>canvas,getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:2}),getStorageSync:k=>saved.get(k),setStorageSync:(k,v)=>saved.set(k,v),onTouchStart:fn=>touch=fn,onWindowResize:fn=>resize=fn,onHide:fn=>hide=fn,vibrateShort(){}};
  const cache=new Map();let nativeGame;
  const env={wx,Date,Math,Map,console,requestAnimationFrame:fn=>raf=fn};
  function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};const local={...env,module,exports:module.exports,require:name=>load(path.resolve(path.dirname(file),name+'.js'))};vm.runInNewContext(fs.readFileSync(file,'utf8'),local,{filename:file});cache.set(file,module.exports);if(file.endsWith(path.join('src','game.js'))){const mount=module.exports.mount;module.exports.mount=(...args)=>{nativeGame=mount(...args);return nativeGame;};}return module.exports;}
  load(path.join(__dirname,'..','game.js'));assert.equal(canvas.width,780);assert.equal(canvas.height,1688);assert.ok(draws>100);assert.equal(nativeGame.state.board.length,4);
  assert.equal(nativeGame.state.screen,'home');nativeGame.startLevel(0);const p=nativeGame.layout;raf();touch({touches:[{clientX:p.x+p.size/2,clientY:p.y+p.size/2}]});assert.equal(nativeGame.state.selected.r,0);assert.equal(nativeGame.state.selected.c,0);
  hide();assert.equal(nativeGame.state.paused,true);raf();assert.equal(nativeGame.state.modal,'pause');resize();
});
