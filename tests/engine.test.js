const {test}=require('node:test');const assert=require('node:assert/strict');const E=require('../src/engine');
test('straight, one corner, two corners, outside paths and blocked paths',()=>{
  assert.ok(E.findPath([[1,0,1]],{r:0,c:0},{r:0,c:2}));
  assert.ok(E.findPath([[1,0],[2,1]],{r:0,c:0},{r:1,c:1}));
  const board=[[2,2,2,2,2],[2,1,0,1,2],[2,2,2,2,2]];
  assert.ok(E.findPath(board,{r:1,c:1},{r:1,c:3}));
  assert.ok(E.findPath([[1,2,1]],{r:0,c:0},{r:0,c:2}));
  assert.equal(E.findPath([[2,2,2,2,2],[2,1,2,1,2],[2,2,2,2,2]],{r:1,c:1},{r:1,c:3}),null);
  assert.equal(E.findPath([[1,2]],{r:0,c:0},{r:0,c:1}),null);
  assert.equal(E.findPath([[1,1]],{r:0,c:0},{r:0,c:0}),null);
});
test('generated boards have a verified full solution, legal paths and paired counts',()=>{
  for(let i=0;i<80;i++){
    const {board,solution}=E.generate(8,6,8);assert.equal(solution.length,24);
    for(const {a,b} of solution){const path=E.findPath(board,a,b);assert.ok(path);let turns=0,last=null;
      for(let j=1;j<path.length;j++){const dr=path[j].r-path[j-1].r,dc=path[j].c-path[j-1].c;assert.equal(Math.abs(dr)+Math.abs(dc),1);const dir=`${dr},${dc}`;if(last&&dir!==last)turns++;last=dir;if(j<path.length-1&&path[j].r>=0&&path[j].r<8&&path[j].c>=0&&path[j].c<6)assert.equal(board[path[j].r][path[j].c],0);}
      assert.ok(turns<=2);board[a.r][a.c]=board[b.r][b.c]=0;
    }assert.ok(board.flat().every(v=>v===0));
  }
});
test('shuffle preserves tiles and empty positions and supplies a move',()=>{
  for(let i=0;i<40;i++){const {board,solution}=E.generate();for(const {a,b}of solution.slice(0,12))board[a.r][a.c]=board[b.r][b.c]=0;
    const next=E.reshuffle(board);assert.deepEqual(next.flat().slice().sort(),board.flat().slice().sort());board.forEach((row,r)=>row.forEach((v,c)=>{if(!v)assert.equal(next[r][c],0);}));assert.ok(E.moves(next));}
});
