define(["easel"], function() {
  var tileset = new createjs.Bitmap("springling/graphics/tileset.png");
  var TileData = {
    tileWidth:      56,
    tileHeight:     29,
    tileImgHeight:  72,
    tileDepth:      9,

    // Types
    templates: {
      deepWater: {
        category: 'ground', 
        displayObject: tileset,
        displayRect: null,
        walkable: false,
      }, 
      water: {
        category: 'ground',
        displayObject: tileset,
        displayRect: null,
        walkable: false,
      }, 
      shallowWater: {
        category: 'ground', 
        displayObject: tileset,
        displayRect: null,
        walkable: false,
      }, 
      beachWater: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: false,
      }, 
      beach: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      lightGrass: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true,
      }, 
      brightGrass: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      tree: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: false
      }, 
      darkGrass: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      dirtGrass: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      dirt: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      dirtStones: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      rock: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      rockStones: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      darkRock: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      mountain: {
        category: 'ground',
        displayObject: tileset, 
        displayRect: null,
        walkable: true
      }, 
      /* STRUCTURES */
      house: {
        category: 'structure', 
        displayObject: new createjs.Bitmap("springling/graphics/house.png"),
        displayRect: null,
        walkable: false,
        cost: 50
      }
    }
  }

  var tilesetX = 0;
  for( var type in TileData.templates ) {
    if( TileData.templates[type].displayObject == tileset ) {
      TileData.templates[type].displayRect = new createjs.Rectangle(tilesetX, 0, TileData.tileWidth, TileData.tileImgHeight);
      tilesetX += TileData.tileWidth;
    }
  }

  return TileData;
});