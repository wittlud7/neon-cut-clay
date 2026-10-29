async (page) => {
 const original=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('neon-')).map(k=>[k,localStorage.getItem(k)])));
 const results=[];
 const click=async id=>{const b=await page.evaluate(id=>laneGame.buttons.find(b=>b.id===id),id);if(!b)throw Error('Missing '+id);await page.mouse.click(b.x+b.w/2,b.y+b.h/2);await page.waitForTimeout(20);};
 for(const id of [9,19,29,39,49,59]){
  await page.evaluate(id=>laneGame.startLevel(id),id);await page.waitForTimeout(100);
  const count=await page.evaluate(id=>CinemaCampaign.levels[id].pairs,id);
  for(let i=0;i<count;i++){const m=await page.evaluate(()=>LaneEngine.moves(laneGame.state.board));if(!m)throw Error('No move');for(const p of [m.a,m.b])await click('tile-'+p.r+'-'+p.c);}
  await page.waitForTimeout(800);if(!await page.evaluate(()=>laneGame.state.modal==='win'))throw Error('No win '+id);results.push({level:id+1,matched:count});
 }
 await page.evaluate(original=>{laneGame.destroy();for(const k of Object.keys(localStorage))if(k.startsWith('neon-'))localStorage.removeItem(k);for(const[k,v]of Object.entries(original))localStorage.setItem(k,v);},original);await page.reload();
 return {completed:results};
}

