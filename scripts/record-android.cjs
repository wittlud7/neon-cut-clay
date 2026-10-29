const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const adb=path.resolve(__dirname,'../../.build-tools/sdk/platform-tools/adb.exe'),serial='emulator-5580',out=path.resolve(__dirname,'../store');
const shell=(...args)=>cp.execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:20000}).trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws,id=0;const pending=new Map();
function evaluate(expression){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,v=>{if(v.result?.exceptionDetails)reject(Error(JSON.stringify(v.result.exceptionDetails)));else resolve(v.result.result.value);});ws.send(JSON.stringify({id:n,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));});}
function snap(file){fs.writeFileSync(path.join(out,file),cp.execFileSync(adb,['-s',serial,'exec-out','screencap','-p']));}
(async()=>{
 const pid=shell('shell','pidof','com.neoncut.game');shell('forward','tcp:9224','localabstract:webview_devtools_remote_'+pid);const [target]=await(await fetch('http://127.0.0.1:9224/json')).json();ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{const v=JSON.parse(e.data);if(v.id){pending.get(v.id)?.(v);pending.delete(v.id);}});
 await evaluate('laneGame.home()');await sleep(200);snap('native-home.png');
 await evaluate('laneGame.startLevel(49)');await sleep(750);snap('native-director.png');
 await evaluate('laneGame.startLevel(14)');await sleep(750);snap('native-gameplay.png');
 const recording=cp.spawn(adb,['-s',serial,'shell','screenrecord','--size','720x1280','--bit-rate','5000000','--time-limit','30','/sdcard/neon-cut-gameplay.mp4'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';recording.stderr.on('data',b=>log+=b);const finished=new Promise((resolve,reject)=>recording.on('exit',code=>code===0?resolve():reject(Error(log))));
 await sleep(800);const started=Date.now();let matches=0;
 while(Date.now()-started<28500){
  const m=await evaluate('LaneEngine.moves(laneGame.state.board)');if(!m)break;
  for(const p of [m.a,m.b]){const b=await evaluate(`laneGame.buttons.find(b=>b.id==='tile-${p.r}-${p.c}')`),ratio=await evaluate('devicePixelRatio');shell('shell','input','tap',String(Math.round((b.x+b.w/2)*ratio)),String(Math.round((b.y+b.h/2)*ratio)));await sleep(100);}
  matches++;await sleep(550);
 }
 await finished;shell('pull','/sdcard/neon-cut-gameplay.mp4',path.join(out,'gameplay-android.mp4'));ws.close();console.log(JSON.stringify({file:'store/gameplay-android.mp4',matches,recordedSeconds:30,size:fs.statSync(path.join(out,'gameplay-android.mp4')).size}));
})().catch(e=>{ws?.close();console.error(e);process.exitCode=1;});
