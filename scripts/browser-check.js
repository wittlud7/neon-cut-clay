async (page) => {
 const assert=(v,s)=>{if(!v)throw Error(s);};const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>{laneGame.destroy();for(const k of Object.keys(localStorage))if(k.startsWith('neon-'))localStorage.removeItem(k);});await page.reload();await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(500);assert(await page.evaluate(()=>laneGame.state.level===0&&laneGame.state.elapsed<1&&laneGame.state.removed===0),'fresh initial state');
 const click=async id=>{const b=await page.evaluate(id=>laneGame.buttons.find(b=>b.id===id),id);assert(b,'Missing '+id);await page.mouse.click(b.x+b.w/2,b.y+b.h/2);await page.waitForTimeout(25);};
 const pair=async()=>{const m=await page.evaluate(()=>LaneEngine.moves(laneGame.state.board));assert(m,'Valid move');for(const p of [m.a,m.b])await click('tile-'+p.r+'-'+p.c);};
 await page.screenshot({path:'lane-link/output/playwright/neon-desktop.png'});
 const original=await page.evaluate(()=>JSON.stringify(laneGame.state.board));await pair();await page.waitForTimeout(75);await page.screenshot({path:'lane-link/output/playwright/neon-animation.png'});await click('rewind');assert(await page.evaluate(b=>JSON.stringify(laneGame.state.board)===b,original),'undo exact');
 await click('hint');assert(await page.evaluate(()=>!!laneGame.state.hint),'hint');await click('shuffle');assert(await page.evaluate(()=>!!LaneEngine.moves(laneGame.state.board)),'shuffle');
 await click('pause');const t=await page.evaluate(()=>laneGame.state.elapsed);await page.waitForTimeout(200);assert(await page.evaluate(t=>laneGame.state.elapsed===t,t),'pause clock');await click('resume');
 for(let i=0;i<8;i++)await pair();await page.waitForTimeout(850);assert(await page.evaluate(()=>laneGame.state.modal==='win'&&laneGame.state.unlocked===1),'win unlock');await page.screenshot({path:'lane-link/output/playwright/neon-win.png'});await click('next');assert(await page.evaluate(()=>laneGame.state.level===1),'next');
 await pair();const saved=await page.evaluate(()=>({board:JSON.stringify(laneGame.state.board),score:laneGame.state.score}));await page.reload();assert(await page.evaluate(s=>JSON.stringify(laneGame.state.board)===s.board&&laneGame.state.score===s.score,saved),'checkpoint');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);await click('map');await click('act-5');assert(await page.evaluate(()=>laneGame.buttons.some(b=>b.id==='level-59')),'60 visible');await page.screenshot({path:'lane-link/output/playwright/neon-map.png'});await click('level-59');assert(await page.evaluate(()=>laneGame.state.modal==='map'),'locked level cannot start');await click('close');
 await page.evaluate(()=>laneGame.startLevel(59));await page.waitForTimeout(600);await page.screenshot({path:'lane-link/output/playwright/neon-level60-mobile.png'});
 await page.setViewportSize({width:320,height:667});await page.waitForTimeout(50);const fit=await page.evaluate(()=>{const l=laneGame.layout,b=laneGame.buttons.find(b=>b.id==='pause');return b.y+b.h<innerHeight&&l.size>=38;});assert(fit,'compact layout bounds');await page.screenshot({path:'lane-link/output/playwright/neon-small-mobile.png'});
 await page.evaluate(()=>{laneGame.destroy();for(const k of Object.keys(localStorage))if(k.startsWith('neon-'))localStorage.removeItem(k);});await page.reload();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(650);await page.screenshot({path:'lane-link/output/playwright/neon-mobile.png'});
 assert(!errors.length,errors.join(';'));return {passed:['actual canvas matching','animation','undo','hint','shuffle','pause','win and next','checkpoint restore','60-level selector','locked levels','mobile and small mobile'],browserErrors:errors};
}


