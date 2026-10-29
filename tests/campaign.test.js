const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../src/engine');
const {levels,acts}=require('../src/campaign');
const boards=require('../src/boards');
test('60 distinct verified levels, six acts, gradual capacity and symbol growth',()=>{
  assert.equal(levels.length,60);assert.equal(acts.length,6);assert.equal(boards.length,60);
  const signatures=new Set();
  for(const l of levels){const b=boards[l.id].board.map(row=>row.slice()),counts=new Map();
    assert.equal(b.length,l.rows);assert.ok(b.every(row=>row.length===l.cols));assert.equal(b.flat().filter(Boolean).length,l.pairs*2);
    for(const v of b.flat())if(v)counts.set(v,(counts.get(v)||0)+1);assert.equal(counts.size,l.types);assert.ok([...counts.values()].every(n=>n%2===0));
    signatures.add(JSON.stringify(b));assert.equal(boards[l.id].solution.length,l.pairs);
    for(const {a,b:other}of boards[l.id].solution){assert.ok(E.findPath(b,a,other),`level ${l.number} has a blocked solution`);b[a.r][a.c]=b[other.r][other.c]=0;}
    assert.ok(b.flat().every(v=>v===0));assert.ok(l.par>=l.pairs*6);
  }
  assert.equal(signatures.size,60);assert.equal(levels[0].pairs,8);assert.equal(levels[59].pairs,30);assert.equal(levels[0].types,4);assert.equal(levels[59].types,12);
  for(let a=0;a<6;a++){const group=levels.filter(l=>l.act===a);assert.equal(group.length,10);for(let i=1;i<group.length;i++){assert.ok(group[i].pairs>=group[i-1].pairs);assert.ok(group[i].types>=group[i-1].types);assert.ok(group[i].pairs-group[i-1].pairs<=2);}}
});
