(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LaneEngine=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Padded coordinates allow routes around all four edges of the board.
  function findPath(board,a,b,requireMatch=true){
    const rows=board.length,cols=board[0].length;
    if(!a||!b||a.r===b.r&&a.c===b.c)return null;
    if(!board[a.r]||!board[b.r]||!board[a.r][a.c]||!board[b.r][b.c])return null;
    if(requireMatch&&board[a.r][a.c]!==board[b.r][b.c])return null;
    const start={r:a.r+1,c:a.c+1},end={r:b.r+1,c:b.c+1};
    const dirs=[[0,1],[1,0],[0,-1],[-1,0]],queue=[],best=new Map();
    for(let d=0;d<4;d++)queue.push({...start,d,turns:0,path:[start]});
    for(let i=0;i<queue.length;i++){
      const s=queue[i];
      for(let d=0;d<4;d++){
        const turns=s.turns+(d===s.d?0:1);if(turns>2)continue;
        const r=s.r+dirs[d][0],c=s.c+dirs[d][1];
        if(r<0||c<0||r>rows+1||c>cols+1)continue;
        const atEnd=r===end.r&&c===end.c;
        if(!atEnd&&r>0&&r<=rows&&c>0&&c<=cols&&board[r-1][c-1])continue;
        const key=r+','+c+','+d;if(best.has(key)&&best.get(key)<=turns)continue;
        best.set(key,turns);const p=s.path.concat({r,c});
        if(atEnd)return p.map(v=>({r:v.r-1,c:v.c-1}));
        queue.push({r,c,d,turns,path:p});
      }
    }return null;
  }
  function moves(board){
    const cells=[];board.forEach((row,r)=>row.forEach((v,c)=>{if(v)cells.push({r,c,v});}));
    for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++)if(cells[i].v===cells[j].v){const path=findPath(board,cells[i],cells[j]);if(path)return {a:cells[i],b:cells[j],path};}
    return null;
  }
  function mix(a,random){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function generate(rows=8,cols=6,types=8,random=Math.random,pairValues){
    if(rows*cols%2)throw Error('Board must have an even number of cells');
    const values=pairValues||Array.from({length:rows*cols/2},(_,i)=>i%types+1);
    // Prefer shuffled layouts, verifying a full solution before accepting one.
    for(let attempt=0;attempt<100;attempt++){
      const tiles=mix(values.flatMap(v=>[v,v]),random);
      const board=Array.from({length:rows},(_,r)=>tiles.slice(r*cols,(r+1)*cols));
      const probe=board.map(row=>row.slice()),solution=[];
      for(let i=0;i<values.length;i++){const move=moves(probe);if(!move)break;solution.push({a:move.a,b:move.b});probe[move.a.r][move.a.c]=probe[move.b.r][move.b.c]=0;}
      if(solution.length===values.length)return {board,solution};
    }
    // Build backwards. Each inserted pair is connected at insertion time;
    // removing pairs in reverse insertion order is a complete solution.
    for(let attempt=0;attempt<12;attempt++){
      const board=Array.from({length:rows},()=>Array(cols).fill(0)),solution=[];
      const free=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)free.push({r,c});
      const order=mix(values.slice(),random);let failed=false;
      for(const value of order){
        mix(free,random);let found=false;
        for(let i=0;i<free.length&&!found;i++)for(let j=i+1;j<free.length&&!found;j++){
          const a=free[i],b=free[j];board[a.r][a.c]=value;board[b.r][b.c]=value;
          if(findPath(board,a,b)){solution.push({a:{...a},b:{...b}});free.splice(j,1);free.splice(i,1);found=true;}
          else {board[a.r][a.c]=0;board[b.r][b.c]=0;}
        }if(!found){failed=true;break;}
      }
      if(!failed)return {board,solution:solution.reverse()};
    }
    // Bounded fallback: adjacent pairs are always removable.
    const board=Array.from({length:rows},()=>Array(cols).fill(0)),solution=[];
    const order=mix(values.slice(),random);
    for(let i=0;i<rows*cols;i+=2){const a={r:Math.floor(i/cols),c:i%cols},b={r:Math.floor((i+1)/cols),c:(i+1)%cols};board[a.r][a.c]=board[b.r][b.c]=order[i/2];solution.push({a,b});}
    return {board,solution};
  }
  function reshuffle(board,random=Math.random){
    const cells=[],counts=new Map();board.forEach((row,r)=>row.forEach((v,c)=>{if(v){cells.push({r,c});counts.set(v,(counts.get(v)||0)+1);}}));
    if(!cells.length)return board.map(row=>row.slice());
    const values=[];for(const [v,n]of counts){if(n%2)throw Error('Unpaired tile');for(let i=0;i<n;i++)values.push(v);}
    for(let tries=0;tries<100;tries++){
      mix(values,random);const out=board.map(row=>row.map(()=>0));cells.forEach((p,i)=>out[p.r][p.c]=values[i]);if(moves(out))return out;
    }
    // Every occupied layout has a connectable pair: use a path ignoring types.
    const out=board.map(row=>row.slice());
    for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++)if(findPath(out,cells[i],cells[j],false)){
      const a=cells[i],b=cells[j],value=out[a.r][a.c];
      const other=cells.find(p=>(p.r!==a.r||p.c!==a.c)&&out[p.r][p.c]===value);
      [out[b.r][b.c],out[other.r][other.c]]=[out[other.r][other.c],out[b.r][b.c]];return out;
    }return out;
  }
  return {findPath,moves,generate,reshuffle};
});
