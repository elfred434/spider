/*
 * Générateur de bâtiments Web Glide.
 *
 * Les silhouettes s'inspirent de grandes familles architecturales réelles
 * sans copier un bâtiment précis. Le générateur est déterministe : un même
 * numéro de chunk produit toujours la même ville.
 */
(function (global) {
  'use strict';

  const COLORS = {
    glass: [.10, .22, .34],
    glassBlue: [.12, .32, .46],
    glassLight: [.30, .60, .68],
    concrete: [.34, .35, .39],
    concreteLight: [.60, .57, .51],
    warmStone: [.50, .36, .25],
    brick: [.42, .18, .12],
    dark: [.055, .08, .13],
    windowBlue: [.20, .67, .78],
    windowGold: [.93, .67, .30],
    windowWarm: [.86, .48, .18],
    redAccent: [.55, .09, .08],
    green: [.10, .34, .21]
  };

  function object(ctx, p, s, color, rotY) {
    ctx.addObject({ p, s, color, rotY: rotY || 0 });
  }

  function anchor(ctx, p) {
    ctx.addAnchor(p);
  }

  function frontWindow(ctx, x, y, z, width, height, color, depth) {
    object(ctx, [x, y, z], [width, height, depth || .045], color);
  }

  function sideWindow(ctx, x, y, z, width, height, color) {
    object(ctx, [x, y, z], [width, height, .045], color, Math.PI / 2);
  }

  function roofDetails(ctx, x, roofY, z, width, depth, seed) {
    object(ctx, [x, roofY + 1.2, z], [width * .28, 1.2, depth * .24], COLORS.dark);
    if (ctx.rand(seed) > .45) {
      object(ctx, [x + width * .35, roofY + 2.1, z], [.10, 2.1, .10], COLORS.windowBlue);
      object(ctx, [x + width * .35, roofY + 4.25, z], [.45, .08, .45], COLORS.windowBlue);
    }
  }

  function glassFinancialTower(ctx, x, z, seed) {
    const width = 8.2 + ctx.rand(seed + 1) * 4.2;
    const depth = 8.5 + ctx.rand(seed + 2) * 4.5;
    const height = 38 + ctx.rand(seed + 3) * 74;
    const body = ctx.rand(seed + 4) > .5 ? COLORS.glass : COLORS.glassBlue;
    object(ctx, [x, height / 2, z], [width, height / 2, depth], body);
    object(ctx, [x - width * .72, height / 2, z + depth + .12], [.22, height / 2 + .04, .08], COLORS.dark);
    object(ctx, [x + width * .72, height / 2, z + depth + .12], [.22, height / 2 + .04, .08], COLORS.dark);

    const floors = Math.max(4, Math.floor(height / 8));
    for (let floor = 0; floor < floors; floor++) {
      const y = 5 + floor * (height - 8) / floors;
      for (let col = -1; col <= 1; col++) {
        const wx = x + col * width * .48;
        frontWindow(ctx, wx, y, z + depth + .16, width * .16, 1.7, floor % 3 === 0 ? COLORS.windowGold : COLORS.windowBlue);
      }
      if (floor % 2 === 0) {
        sideWindow(ctx, x + width + .16, y, z - depth * .42, 1.7, depth * .16, COLORS.windowBlue);
        sideWindow(ctx, x - width - .16, y, z + depth * .42, 1.7, depth * .16, COLORS.windowBlue);
      }
    }
    roofDetails(ctx, x, height, z, width, depth, seed + 8);
    anchor(ctx, [x, height + 5, z]);
    if (ctx.rand(seed + 11) > .55) anchor(ctx, [x + width * .85, height * .68, z + depth]);
  }

  function artDecoTower(ctx, x, z, seed) {
    const width = 9 + ctx.rand(seed + 1) * 4;
    const depth = 8 + ctx.rand(seed + 2) * 4;
    const height = 48 + ctx.rand(seed + 3) * 48;
    const baseHeight = height * .58;
    object(ctx, [x, baseHeight / 2, z], [width, baseHeight / 2, depth], COLORS.concrete);
    object(ctx, [x, baseHeight + (height - baseHeight) * .30, z], [width * .78, (height - baseHeight) * .30, depth * .78], COLORS.warmStone);
    object(ctx, [x, baseHeight + (height - baseHeight) * .70, z], [width * .52, (height - baseHeight) * .22, depth * .52], COLORS.concreteLight);
    object(ctx, [x, height + 2.2, z], [width * .16, 2.2, depth * .16], COLORS.redAccent);

    const floors = Math.floor(baseHeight / 7);
    for (let floor = 0; floor < floors; floor++) {
      const y = 5 + floor * 6.4;
      for (let col = -2; col <= 2; col++) {
        frontWindow(ctx, x + col * width * .32, y, z + depth + .16, .22, 1.65, floor % 2 ? COLORS.windowWarm : COLORS.windowGold);
      }
      if (floor % 3 === 0) object(ctx, [x, y - 2.8, z + depth + .18], [width * .95, .16, .12], COLORS.dark);
    }
    anchor(ctx, [x, height + 5, z]);
    anchor(ctx, [x + width * .60, baseHeight * .72, z + depth]);
  }

  function residentialBlock(ctx, x, z, seed) {
    const width = 12 + ctx.rand(seed + 1) * 8;
    const depth = 9 + ctx.rand(seed + 2) * 5;
    const height = 22 + ctx.rand(seed + 3) * 28;
    const wall = ctx.rand(seed + 4) > .45 ? COLORS.warmStone : COLORS.brick;
    object(ctx, [x, height / 2, z], [width, height / 2, depth], wall);

    const floors = Math.max(3, Math.floor(height / 5));
    for (let floor = 0; floor < floors; floor++) {
      const y = 4 + floor * (height - 7) / floors;
      for (let col = -2; col <= 2; col++) {
        const wx = x + col * width * .36;
        frontWindow(ctx, wx, y, z + depth + .18, .30, 1.15, floor % 3 === 0 ? COLORS.windowWarm : COLORS.windowGold);
        if (floor % 2 === 0) object(ctx, [wx, y - 1.35, z + depth + .28], [.45, .06, .28], COLORS.concreteLight);
      }
    }
    object(ctx, [x, height + .4, z], [width * 1.08, .28, depth * 1.06], COLORS.concreteLight);
    object(ctx, [x, height + 1.8, z], [width * .74, 1.2, depth * .72], COLORS.dark);
    anchor(ctx, [x, height + 4, z]);
  }

  function steppedMegaTower(ctx, x, z, seed) {
    const width = 11 + ctx.rand(seed + 1) * 5;
    const depth = 11 + ctx.rand(seed + 2) * 5;
    const height = 70 + ctx.rand(seed + 3) * 68;
    const levels = 4 + Math.floor(ctx.rand(seed + 4) * 3);
    const levelHeight = height / levels;
    for (let level = 0; level < levels; level++) {
      const factor = 1 - level * .13;
      const w = width * factor;
      const d = depth * factor;
      const y = level * levelHeight + levelHeight / 2;
      object(ctx, [x + (level % 2 ? 1.5 : 0), y, z], [w, levelHeight / 2, d], level % 2 ? COLORS.glassBlue : COLORS.glass);
      object(ctx, [x + (level % 2 ? 1.5 : 0), level * levelHeight + .20, z + d + .16], [w * .88, .11, .07], COLORS.windowBlue);
      for (let col = -1; col <= 1; col++) {
        frontWindow(ctx, x + (level % 2 ? 1.5 : 0) + col * w * .42, y, z + d + .20, .18, levelHeight * .23, COLORS.windowBlue);
      }
    }
    object(ctx, [x, height + 8, z], [.16, 8, .16], COLORS.dark);
    object(ctx, [x, height + 16.2, z], [1.3, .12, 1.3], COLORS.windowBlue);
    anchor(ctx, [x, height + 18, z]);
  }

  function coastalTropicalTower(ctx, x, z, seed) {
    const width = 10 + ctx.rand(seed + 1) * 5;
    const depth = 9 + ctx.rand(seed + 2) * 5;
    const height = 30 + ctx.rand(seed + 3) * 35;
    object(ctx, [x, height / 2, z], [width, height / 2, depth], COLORS.concreteLight);
    const floors = Math.floor(height / 5);
    for (let floor = 0; floor < floors; floor++) {
      const y = 4 + floor * 5;
      object(ctx, [x, y, z + depth + .25], [width * 1.08, .16, .75], COLORS.concrete);
      for (let col = -1; col <= 1; col++) {
        frontWindow(ctx, x + col * width * .44, y + 1.5, z + depth + .18, .42, 1.1, COLORS.windowBlue);
      }
    }
    object(ctx, [x, height + 1.2, z], [width * .88, 1.1, depth * .82], COLORS.green);
    object(ctx, [x - width * .72, height * .45, z + depth + .35], [.16, height * .45, .16], COLORS.dark);
    object(ctx, [x + width * .72, height * .45, z + depth + .35], [.16, height * .45, .16], COLORS.dark);
    anchor(ctx, [x, height + 5, z]);
    if (ctx.rand(seed + 9) > .5) anchor(ctx, [x + width, height * .62, z + depth]);
  }

  function generateCityChunk(ctx) {
    const i = ctx.index;
    const z = ctx.z;
    const slots = [-72, -45, -18, 18, 45, 72];
    for (let slot = 0; slot < slots.length; slot++) {
      const seed = ctx.seed + slot * 37;
      const x = slots[slot] + (ctx.rand(seed) - .5) * 7;
      const style = Math.floor(ctx.rand(seed + 70) * 5);
      if (style === 0) glassFinancialTower(ctx, x, z + (ctx.rand(seed + 80) - .5) * 8, seed);
      else if (style === 1) artDecoTower(ctx, x, z + (ctx.rand(seed + 80) - .5) * 8, seed);
      else if (style === 2) residentialBlock(ctx, x, z + (ctx.rand(seed + 80) - .5) * 8, seed);
      else if (style === 3) steppedMegaTower(ctx, x, z + (ctx.rand(seed + 80) - .5) * 8, seed);
      else coastalTropicalTower(ctx, x, z + (ctx.rand(seed + 80) - .5) * 8, seed);
    }

    // Une plateforme de traversée varie d'un chunk à l'autre.
    if (i % 2 === 0) {
      object(ctx, [-48, 10, z + 8], [8, 1, 8], [.08, .42, .48]);
      anchor(ctx, [-48, 13, z + 8]);
    }
  }

  global.WebGlideBuildings = {
    styles: [
      'glass_financial_tower',
      'art_deco_tower',
      'european_residential_block',
      'stepped_mega_tower',
      'coastal_tropical_tower'
    ],
    generateCityChunk
  };
})(window);
