(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CinemaCampaign=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const acts=[
    {name:'弥敦夜雨',genre:'雨夜开场',en:'NATHAN ROAD',accent:'#47876c',secondary:'#c89365',names:['霓虹初上','街角电话','第一杯茶','没有署名','旧唱片','两张车票','雨中来客','末班之后','匿名来信','弥敦夜雨']},
    {name:'金记冰室',genre:'人间烟火',en:'GOLDEN CAFE',accent:'#bd7665',secondary:'#6e987d',names:['早茶','菠萝油','二号餐桌','冻柠茶','熟客','窗边的她','下午三点','打烊之前','再来一杯','金记冰室']},
    {name:'天台来信',genre:'城市心事',en:'ROOFTOP LETTERS',accent:'#9e7599',secondary:'#789ca0',names:['上楼','城市边缘','秘密约定','旧照片','背面的字','一通电话','雨停以前','隔街相望','未寄出的信','天台来信']},
    {name:'维港迷雾',genre:'暗线交锋',en:'HARBOUR NOIR',accent:'#5f93a4',secondary:'#a28a68',names:['渡轮','雾中灯火','接头暗号','失物招领','双面线索','无人码头','交错身影','隐藏证词','破晓之前','维港迷雾']},
    {name:'午夜电车',genre:'时序交错',en:'MIDNIGHT TRAM',accent:'#718f69',secondary:'#ba8865',names:['叮叮','环线','错过一站','零点零分','记忆碎片','回程','昨日车票','平行时刻','终点之前','午夜电车']},
    {name:'最后一幕',genre:'导演剪辑',en:'THE FINAL CUT',accent:'#ac8545',secondary:'#b47b9c',names:['最后开机','未完待续','长镜头','平行故事','交叉剪辑','高潮将至','命运交点','最终谜底','谢幕之前','最后一幕']}
  ];
  const pairs=[ [8,10,12,12,14,14,16,16,18,18], [16,16,18,18,20,20,20,22,22,24], [18,18,20,20,22,22,24,24,24,26], [20,20,22,22,24,24,26,26,26,28], [22,22,24,24,26,26,26,28,28,28], [24,24,26,26,28,28,28,30,30,30] ];
  const levels=Array.from({length:60},(_,i)=>{
    const act=Math.floor(i/10),step=i%10,p=pairs[act][step],cols=i===0?4:6;
    const rows=Math.ceil(p*2/cols),types=Math.min(p,Math.min(12,4+act+Math.floor(step/3)));
    const objective=act===0?{kind:'clean',text:'不用提示或手动换位'}:act===1?{kind:'combo',target:step<5?5:6,text:`达成 ${step<5?5:6} 连击`}:act===2?{kind:'bends',target:step<7?2:3,text:`完成 ${step<7?2:3} 次两拐连线`}:act===3?{kind:'combo',target:step<5?7:8,text:`达成 ${step<5?7:8} 连击`}:act===4?{kind:'steady',text:'不用倒带或手动换位'}:{kind:'director',text:'达成 8 连击及 2 次两拐连线'};
    return {id:i,number:i+1,act,step,name:acts[act].names[step],rows,cols,pairs:p,types,seed:73013+i*7919,layout:i<3?'full':['frame','diamond','split','full'][i%4],par:Math.round(p*(act<2?8:9)+15),rewindLimit:2,objective};
  });
  function objectiveMet(l,s){const o=l.objective;return o.kind==='clean'?s.hintsUsed+s.shufflesUsed===0:o.kind==='combo'?(s.bestCombo||0)>=o.target:o.kind==='bends'?s.bends>=o.target:o.kind==='steady'?s.rewindsUsed+s.shufflesUsed===0:(s.bestCombo||0)>=8&&s.bends>=2;}
  return {acts,levels,objectiveMet};
});
