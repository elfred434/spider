/*
 * Génération procédurale du décor 3D de Web Glide.
 * Les éléments sont stylisés, mais reprennent des formes observables dans
 * des environnements urbains, forestiers, montagneux et volcaniques réels.
 */
(function (global) {
  'use strict';

  const C = {
    asphalt: [.055, .065, .085],
    roadLine: [.72, .72, .62],
    sidewalk: [.28, .29, .31],
    lamp: [.12, .15, .19],
    lampGlow: [1.0, .72, .28],
    leafDark: [.035, .20, .10],
    leaf: [.06, .38, .16],
    leafLight: [.18, .52, .20],
    trunk: [.25, .12, .045],
    root: [.16, .07, .025],
    rock: [.18, .20, .24],
    rockDark: [.09, .105, .13],
    rockLight: [.34, .34, .36],
    snow: [.80, .88, .92],
    water: [.08, .48, .68],
    lava: [1.0, .12, .015],
    lavaBright: [1.0, .46, .025],
    ash: [.12, .045, .035],
    smoke: [.16, .15, .15],
    wood: [.30, .15, .065],
    rope: [.55, .31, .12],
    neonPink: [.95, .12, .38],
    neonBlue: [.10, .54, .82]
  };

  function add(ctx, p, s, color, extra) {
    ctx.addObject(Object.assign({ p, s, color }, extra || {}));
  }
  function sphere(ctx, p, s, color) {
    add(ctx, p, s, color, { shape: 'sphere' });
  }
  function anchor(ctx, p) {
    ctx.addAnchor(p);
  }
  function between(ctx, a, b, width, color) {
    const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2];
    const length=Math.hypot(dx,dy,dz);
    const middle=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
    // Les poutres sont verticales par défaut. Une rotation simple sur Z
    // donne des câbles et passerelles lisibles dans le prototype.
    const angle=Math.atan2(-dx,dy);
    add(ctx,middle,[width,length/2,width],color,{rotZ:angle});
  }

  function streetLamp(ctx, x, z, side) {
    add(ctx,[x,5,z],[.11,5,.11],C.lamp);
    add(ctx,[x + side*.8,10,z],[.8,.10,.10],C.lamp);
    sphere(ctx,[x + side*1.45,9.75,z],[.24,.24,.24],C.lampGlow);
  }

  function generateCity(ctx) {
    // Chaussée, voies et trottoirs donnent une échelle urbaine aux tours.
    add(ctx,[0,.12,ctx.z],[145,.12,ctx.chunkLength/2],C.asphalt);
    for (let lane=-2; lane<=2; lane++) {
      for (let dash=-1; dash<=1; dash++) {
        add(ctx,[lane*18,.29,ctx.z+dash*12],[.18,.035,3.4],C.roadLine);
      }
    }
    add(ctx,[-126,.42,ctx.z],[11,.25,ctx.chunkLength/2],C.sidewalk);
    add(ctx,[126,.42,ctx.z],[11,.25,ctx.chunkLength/2],C.sidewalk);

    for (let side of [-1,1]) {
      streetLamp(ctx,side*112,ctx.z-12,side);
      if (ctx.rand(ctx.seed+side*4)>.38) streetLamp(ctx,side*112,ctx.z+15,side);
    }

    // Une passerelle suspendue apparaît de temps en temps entre deux tours.
    if (ctx.index%3===0) {
      add(ctx,[0,28,ctx.z+4],[42,.35,2.4],C.rockDark);
      add(ctx,[-30,29,ctx.z+4],[.22,2,.22],C.rope);
      add(ctx,[30,29,ctx.z+4],[.22,2,.22],C.rope);
      between(ctx,[-30,31,ctx.z+4],[30,31,ctx.z+4],.10,C.rope);
      anchor(ctx,[0,32,ctx.z+4]);
    }

    // Petits arbres de rue et panneaux lumineux.
    if (ctx.index%2===0) {
      for (const side of [-1,1]) {
        const x=side*(104+ctx.rand(ctx.seed+side*9)*12);
        add(ctx,[x,2.8,ctx.z+8],[.28,2.8,.28],C.trunk);
        sphere(ctx,[x,6.4,ctx.z+8],[2.2,2.0,2.2],C.leaf);
      }
    }
    add(ctx,[0,3.3,ctx.z-16],[.16,3.3,.16],C.lamp);
    add(ctx,[0,6.5,ctx.z-16],[1.1,.55,.08],ctx.index%2 ? C.neonBlue : C.neonPink);
  }

  function tree(ctx, x, z, scale, seed) {
    const height=(18+ctx.rand(seed)*30)*scale;
    const trunkWidth=.9*scale;
    add(ctx,[x,height/2,z],[trunkWidth,height/2,trunkWidth],C.trunk);
    // Racines visibles autour du pied.
    for (let r=0; r<4; r++) {
      const angle=r*Math.PI/2 + ctx.rand(seed+r)*.3;
      add(ctx,[x+Math.cos(angle)*2.5*scale,.55*scale,z+Math.sin(angle)*2.5*scale],[2.5*scale,.45*scale,.32*scale],C.root,{rotY:angle});
    }
    // Branches étagées.
    for (let branch=0; branch<3; branch++) {
      const y=height*(.46+branch*.15);
      const side=branch%2 ? -1 : 1;
      add(ctx,[x+side*2.2*scale,y,z],[2.4*scale,.26*scale,.26*scale],C.trunk,{rotZ:side*.28});
    }
    sphere(ctx,[x,height+3.5*scale,z],[6.0*scale,5.3*scale,6.0*scale],C.leafDark);
    sphere(ctx,[x-2.7*scale,height+1.8*scale,z+1.3*scale],[3.8*scale,3.2*scale,3.8*scale],C.leaf);
    sphere(ctx,[x+2.5*scale,height+2.1*scale,z-1.3*scale],[3.5*scale,3.0*scale,3.5*scale],C.leafLight);
    anchor(ctx,[x,height+10*scale,z]);
  }

  function rock(ctx, x, z, scale, seed, snow=false) {
    const h=(3+ctx.rand(seed)*8)*scale;
    sphere(ctx,[x,h/2,z],[5*scale,h/2,4*scale],ctx.rand(seed+1)>.5?C.rock:C.rockDark);
    if (snow) add(ctx,[x,h*.92,z],[3.2*scale,.35*scale,2.6*scale],C.snow);
  }

  function generateForest(ctx) {
    // Sol forestier irrégulier et plaques de mousse.
    add(ctx,[0,-2,ctx.z],[150,2,ctx.chunkLength/2],[.035,.13,.065]);
    for (let t=0; t<7; t++) {
      const x=(ctx.rand(ctx.seed+t*13)-.5)*120;
      const z=ctx.z+(ctx.rand(ctx.seed+t*19)-.5)*32;
      tree(ctx,x,z,.72+ctx.rand(ctx.seed+t*23)*.62,ctx.seed+t*41);
    }
    for (let r=0; r<7; r++) {
      const x=(ctx.rand(ctx.seed+200+r)-.5)*125;
      const z=ctx.z+(ctx.rand(ctx.seed+240+r)-.5)*34;
      rock(ctx,x,z,.45+ctx.rand(ctx.seed+280+r)*.65,ctx.seed+300+r);
    }
    // Passerelle de bois et petite cascade stylisée.
    if (ctx.index%3===1) {
      add(ctx,[0,9,ctx.z],[24,.35,2.4],C.wood);
      for (let post=-10; post<=10; post+=5) add(ctx,[post,5,ctx.z],[.18,5,.18],C.wood);
      between(ctx,[-12,12,ctx.z],[12,12,ctx.z],.10,C.rope);
      anchor(ctx,[0,14,ctx.z]);
    }
    if (ctx.index%4===0) {
      add(ctx,[58,7,ctx.z],[4,7,1.4],C.water);
      add(ctx,[55,2,ctx.z+10],[6,2,2],C.water);
    }
  }

  function mountainPeak(ctx, x, z, scale, seed) {
    const base=16*scale;
    const height=(28+ctx.rand(seed)*28)*scale;
    // Empilement de volumes pour une silhouette de crête plus naturelle.
    add(ctx,[x,height*.18,z],[base, height*.18, base*.8],C.rockDark);
    add(ctx,[x,height*.43,z],[base*.72,height*.26,base*.55],C.rock);
    add(ctx,[x,height*.72,z],[base*.42,height*.25,base*.34],C.rockLight);
    add(ctx,[x,height*.96,z],[base*.17,height*.13,base*.14],C.snow);
    anchor(ctx,[x,height+6,z]);
  }

  function generateMountains(ctx) {
    add(ctx,[0,-2,ctx.z],[150,2,ctx.chunkLength/2],[.12,.13,.16]);
    for (let peak=0; peak<5; peak++) {
      const x=(ctx.rand(ctx.seed+peak*10)-.5)*130;
      const z=ctx.z+(ctx.rand(ctx.seed+peak*14)-.5)*30;
      mountainPeak(ctx,x,z,.65+ctx.rand(ctx.seed+peak*18)*.7,ctx.seed+peak*25);
    }
    for (let r=0; r<8; r++) {
      const x=(ctx.rand(ctx.seed+100+r)-.5)*125;
      const z=ctx.z+(ctx.rand(ctx.seed+140+r)-.5)*34;
      rock(ctx,x,z,.65+ctx.rand(ctx.seed+170+r)*.9,ctx.seed+190+r,true);
    }
    if (ctx.index%2===1) {
      add(ctx,[0,22,ctx.z],[30,.30,1.8],C.wood);
      add(ctx,[-14,12,ctx.z],[.22,12,.22],C.wood);
      add(ctx,[14,12,ctx.z],[.22,12,.22],C.wood);
      between(ctx,[-14,24,ctx.z],[14,24,ctx.z],.09,C.rope);
      anchor(ctx,[0,27,ctx.z]);
    }
  }

  function basaltColumn(ctx, x, z, seed) {
    const h=5+ctx.rand(seed)*17;
    add(ctx,[x,h/2,z],[2+ctx.rand(seed+1)*3,h/2,2+ctx.rand(seed+2)*3],C.ash,{rotY:ctx.rand(seed+3)});
    add(ctx,[x,h+.25,z],[1.2,.25,1.2],C.lava);
    anchor(ctx,[x,h+4,z]);
  }

  function generateVolcano(ctx) {
    add(ctx,[0,-2,ctx.z],[150,2,ctx.chunkLength/2],C.ash);
    for (let b=0; b<8; b++) {
      const x=(ctx.rand(ctx.seed+b*8)-.5)*125;
      const z=ctx.z+(ctx.rand(ctx.seed+b*11)-.5)*32;
      basaltColumn(ctx,x,z,ctx.seed+b*17);
    }
    // Coulée de lave en morceaux, pour une lecture 3D et une faible charge.
    const side=ctx.rand(ctx.seed+80)>.5 ? 1 : -1;
    for (let part=0; part<5; part++) {
      const x=side*(part*12+ctx.rand(ctx.seed+90+part)*7);
      add(ctx,[x,.18,ctx.z-8+part*5],[5,.18,2.0],part%2?C.lava:C.lavaBright,{rotY:side*.18});
    }
    // Cratère et fumée au loin.
    if (ctx.index%3===0) {
      add(ctx,[0,8,ctx.z+10],[18,2,18],C.rockDark);
      add(ctx,[0,10.2,ctx.z+10],[11,.25,11],C.lava);
      sphere(ctx,[0,17,ctx.z+10],[5,7,5],C.smoke);
      sphere(ctx,[3,25,ctx.z+10],[4,5,4],C.smoke);
      anchor(ctx,[0,31,ctx.z+10]);
    }
    // Petites fumerolles latérales.
    for (let vent=0; vent<3; vent++) {
      const x=(vent-1)*36;
      add(ctx,[x,6,ctx.z-10],[.8,6,.8],C.rockDark);
      sphere(ctx,[x,14,ctx.z-10],[2.5,4,2.5],C.smoke);
    }
  }

  function generateChunk(ctx) {
    if (ctx.biome === 'Ville') generateCity(ctx);
    else if (ctx.biome === 'Forêt géante') generateForest(ctx);
    else if (ctx.biome === 'Montagnes') generateMountains(ctx);
    else generateVolcano(ctx);
  }

  global.WebGlideScenery = { generateChunk };
})(window);
