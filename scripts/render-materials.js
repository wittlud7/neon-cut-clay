// Original compositions using the game's prerendered 3D models.
async(page)=>{
 await page.goto('http://127.0.0.1:4197');await page.waitForFunction(()=>CinemaArt.hasSprites());await page.setViewportSize({width:1940,height:1940});
 async function canvasShot(id,w,h,kind,file){
  await page.evaluate(({id,w,h,kind})=>{const c=document.createElement('canvas');c.id=id;c.width=w;c.height=h;c.style=`position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:9999`;document.body.appendChild(c);const x=c.getContext('2d');
   x.fillStyle='#f6f3eb';x.fillRect(0,0,w,h);
   if(kind==='icon'){
    x.fillStyle='#b8d8c7';x.fillRect(0,0,w,h);x.fillStyle='#ecede0';x.beginPath();x.ellipse(w*.5,h*.81,w*.41,h*.13,0,0,Math.PI*2);x.fill();
    CinemaArt.prop(x,2,w*.12,h*.05,w*.75);CinemaArt.prop(x,1,w*.53,h*.48,w*.45);CinemaArt.prop(x,3,w*.015,h*.52,w*.43);
   }else{
    x.fillStyle='#c4ddcc';x.beginPath();x.roundRect(w*.05,h*.09,w*.9,h*.84,80);x.fill();
    x.fillStyle='#f6f3eb';x.beginPath();x.ellipse(w*.57,h*.86,w*.35,h*.09,0,0,Math.PI*2);x.fill();
    x.fillStyle='#205d50';x.font=`700 ${kind==='wide'?142:134}px "Microsoft YaHei",sans-serif`;x.textBaseline='middle';x.fillText('霓虹片场',w*.11,h*.24);
    CinemaArt.prop(x,2,w*.32,h*.30,w*.45);CinemaArt.prop(x,1,w*.64,h*.43,w*.28);CinemaArt.prop(x,3,w*.10,h*.55,w*.30);CinemaArt.prop(x,4,w*.47,h*.66,w*.23);
   }
  },{id,w,h,kind});await page.locator('#'+id).screenshot({path:file});await page.evaluate(id=>document.getElementById(id).remove(),id);
 }
 await canvasShot('iconAsset',1024,1024,'icon','lane-link/store/icon-1024.png');
 await canvasShot('wideMaterial',1920,1080,'wide','lane-link/store/cover-1920x1080.png');
 await canvasShot('squareMaterial',1440,1440,'square','lane-link/store/cover-1440x1440.png');
 await page.setViewportSize({width:390,height:844});return {icon:[1024,1024],wide:[1920,1080],square:[1440,1440],source:'original prerendered 3D game props'};
}
