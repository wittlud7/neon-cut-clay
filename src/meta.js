(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CinemaMeta=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const stories=[
  {title:'一通没有挂断的电话',lines:['凌晨一点，戏院门口的电话响了。','听筒里的人只说：帮我找回六卷胶片。','第一卷的片头，是你从未见过的自己。'],ending:'电话再次响起。这次，你记住了那个人的声音。'},
  {title:'第二杯冻柠茶',lines:['金记冰室的老板每天会多放一杯茶。','收据背面写着十年前的放映时间。','有人一直在等一场没有开演的电影。'],ending:'杯底压着一张旧票。座位号，与你的一样。'},
  {title:'寄往昨天的信',lines:['天台晾衣绳上，挂着一封没有邮戳的信。','里面只有一张照片和一行字：别错过末班车。','照片里，戏院的招牌还没有熄灭。'],ending:'照片背面，你认出了自己的笔迹。'},
  {title:'雾中的放映师',lines:['渡轮的最后一班不出现在时刻表上。','放映师提着空片箱，站在无人码头。','他说，丢失的不是电影，是你没说完的话。'],ending:'海雾散去，空片箱里多了一卷温热的胶片。'},
  {title:'零点环线',lines:['午夜电车开往早已拆除的那条街。','每经过一站，窗外就年轻一年。','你终于看到了那晚没有等到的人。'],ending:'车票上没有终点。你决定坐回去。'},
  {title:'最后一幕',lines:['六卷胶片在同一束光里接上。','荧幕里的你转过头，像在等一个回答。','这一次，你没有留在座位上。'],ending:'天亮了。你推开戏院的门，城市正重新开场。'}
 ];
 const achievements=[
  {id:'first',title:'第一声开拍',desc:'完成第一关',test:p=>Object.keys(p.records).length>=1},
  {id:'ten',title:'弥敦夜行',desc:'完成第一幕',test:p=>!!p.records[9]},
  {id:'twenty',title:'冰室熟客',desc:'完成第二幕',test:p=>!!p.records[19]},
  {id:'sixty',title:'导演剪辑版',desc:'完成全部 60 关',test:p=>Object.keys(p.records).length>=60},
  {id:'stars',title:'星光拾遗',desc:'累计获得 30 星',test:p=>Object.values(p.records).reduce((s,r)=>s+r.stars,0)>=30},
  {id:'perfect',title:'完美一幕',desc:'任意一关获得三星',test:p=>Object.values(p.records).some(r=>r.stars===3)},
  {id:'chain',title:'一镜到底',desc:'达成 10 连击',test:p=>(p.stats.maxCombo||0)>=10},
  {id:'props',title:'旧物收藏家',desc:'发现全部 12 种道具',test:p=>Object.keys(p.stats.props||{}).length>=12},
  {id:'bends',title:'迂回的浪漫',desc:'完成 50 次两拐配对',test:p=>(p.stats.bends||0)>=50},
  {id:'daily',title:'今夜有约',desc:'完成 3 天的每日放映',test:p=>Object.keys(p.daily||{}).length>=3}
 ];
 const propNotes=['冰块轻轻撞着杯壁，等的人还没到。','最后一通电话，响了很久。','两小时的故事，卷成掌心大小。','去程是偶遇，回程是约定。','唱针落下，城市慢了半拍。','有些话，在纸上才说得出来。','刚出炉的时候，谁都会笑。','红灯前的几秒，足够看清一个人。','底片留下的，比记忆可靠一点。','它停在你们告别的那一分钟。','按下播放，那个人又说了一遍你好。','雨停以后，仍然有人不愿收伞。'];
 function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
 function dailyLevel(unlocked,date=dateKey()){let hash=0;for(const c of date)hash=(hash*31+c.charCodeAt(0))>>>0;return hash%(Math.min(59,unlocked)+1);}
 function earned(p){return achievements.filter(a=>a.test({...p,stats:p.stats||{}})).map(a=>a.id);}
 function validProgress(p){
  if(!p||!Number.isInteger(p.unlocked)||p.unlocked<0||p.unlocked>59||!p.records||typeof p.records!=='object'||Array.isArray(p.records))return false;
  for(const [id,r]of Object.entries(p.records))if(!/^\d+$/.test(id)||+id>59||!r||![1,2,3].includes(r.stars)||!Number.isFinite(r.score)||r.score<0||!Number.isFinite(r.time)||r.time<0)return false;
  if(p.stats!==undefined){if(!p.stats||typeof p.stats!=='object'||!p.stats.props||typeof p.stats.props!=='object'||Array.isArray(p.stats.props))return false;for(const [id,n]of Object.entries(p.stats.props))if(!/^\d+$/.test(id)||+id<1||+id>12||!Number.isSafeInteger(n)||n<0)return false;for(const k of ['bends','maxCombo'])if(p.stats[k]!==undefined&&(!Number.isSafeInteger(p.stats[k])||p.stats[k]<0))return false;}
  if(p.daily!==undefined){if(!p.daily||typeof p.daily!=='object'||Array.isArray(p.daily)||Object.keys(p.daily).length>10000)return false;for(const [date,r]of Object.entries(p.daily)){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!r||!Number.isInteger(r.level)||r.level<0||r.level>59)return false;if(r.completed!==undefined&&typeof r.completed!=='boolean')return false;for(const k of ['score','time'])if(r[k]!==undefined&&(!Number.isFinite(r[k])||r[k]<0))return false;}}
  if(p.storySeen!==undefined){if(!p.storySeen||typeof p.storySeen!=='object'||Array.isArray(p.storySeen))return false;for(const [id,v]of Object.entries(p.storySeen))if(!/^[0-5]$/.test(id)||typeof v!=='boolean')return false;}
  return true;
 }
 return {stories,achievements,propNotes,dateKey,dailyLevel,earned,validProgress};
});
