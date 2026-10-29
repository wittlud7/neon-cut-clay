const fs=require('node:fs'),path=require('node:path');
const E=require('../src/engine'),{levels}=require('../src/campaign');
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function shuffle(a,random){for(let i=a.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function solve(board){const copy=board.map(r=>r.slice()),solution=[];let m;while(m=E.moves(copy)){solution.push({a:{r:m.a.r,c:m.a.c},b:{r:m.b.r,c:m.b.c}});copy[m.a.r][m.a.c]=copy[m.b.r][m.b.c]=0;}return copy.flat().every(v=>!v)?solution:null;}
function slots(l){const a=[];for(let r=0;r<l.rows;r++)for(let c=0;c<l.cols;c++)a.push({r,c});const cr=(l.rows-1)/2,cc=(l.cols-1)/2;
  const score=p=>l.layout==='diamond'?Math.abs(p.r-cr)/l.rows+Math.abs(p.c-cc)/l.cols:l.layout==='frame'?-Math.min(p.r,p.c,l.rows-1-p.r,l.cols-1-p.c):l.layout==='split'?-(Math.abs(p.c-cc)+Math.abs(p.r-cr)*.08):p.r*l.cols+p.c;
  return a.sort((a,b)=>score(a)-score(b)).slice(0,l.pairs*2);
}
const boards=levels.map(l=>{
 const random=rng(l.seed),positions=slots(l),values=Array.from({length:l.pairs},(_,i)=>i%l.types+1).flatMap(v=>[v,v]);
 for(let attempt=0;attempt<2400;attempt++){
  shuffle(values,random);const board=Array.from({length:l.rows},()=>Array(l.cols).fill(0));positions.forEach((p,i)=>board[p.r][p.c]=values[i]);
  const solution=solve(board);if(solution){console.log(`${l.number}: ${l.rows}x${l.cols}, ${l.types} types, ${attempt+1} candidates`);return {board,solution};}
 }
 throw Error('Could not build level '+l.number);
});
fs.writeFileSync(path.join(__dirname,'../src/boards.js'),`(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.CinemaBoards=data;})(typeof globalThis!=='undefined'?globalThis:this,${JSON.stringify(boards)});\n`);
