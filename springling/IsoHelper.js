//
// IsoHelper
// Provides isometric grid / screen coordinate translation, A* path finding, and various utility functions
// Probably should be split up into multiple modules
//

define(["./TileData", "nodes/EditorTileNode", "components/Position", "components/GridXYZ", "components/GridMapping", "components/Display", "components/Tile", "easel"], function(TileData, EditorTileNode, Position, GridXYZ, GridMapping, Display, Tile) {
  
  function IsoHelper() {
  
    // Public Properties
  
    this.tileWidth     = TileData.tileWidth;
    this.tileHeight    = TileData.tileHeight;
    this.tileImgHeight = TileData.tileImgHeight;
    this.tileDepth     = TileData.tileDepth;

    // Private Properties
  
    var _heightmap;
    var _heightmapBufferStage; // Second render stage used to perform elevation based tile lookup. Primarily used in screenToGridCoords
    var _heightmapBufferCamera; // Camera framing the map, used to keep buffer and actual render stage frame in sync
    var _bufferLookupTable = new Array(); // Buffer stage display objects by grid position

    var _bufferTile = new createjs.Bitmap("springling/graphics/bufferTileset.png"); // Tile image used to render tiles in buffer
    var _bufferTileFullRect = new createjs.Rectangle(0, 0, this.tileWidth, this.tileImgHeight); 
    var _bufferTileEdgeRect = new createjs.Rectangle(this.tileWidth, 0, this.tileWidth, this.tileImgHeight);

    var _self = this;

    // Public Functions

    // Coordinate Translations

    // gridToScreenCoords(GridXYZ gridXYZ, createjs.Point nonTileOffset)
    // Returns a createjs.Point with the screen coordiantes of the draw origin for a tile at location gridXYZ, offset by nonTileOffset to allow non-tile 
    // display objects to account for their image size and still draw correctly on to the grid
    this.gridToScreenCoords = function(gridXYZ, nonTileOffset) {
      // Calculate isometric tranlsation
      var screenCoords = new createjs.Point();
      screenCoords.x = (gridXYZ.y * this.tileWidth / 2) + (gridXYZ.x * this.tileWidth / 2);
      screenCoords.y = (gridXYZ.x * this.tileHeight / 2) - (gridXYZ.y * this.tileHeight / 2) - (gridXYZ.z * this.tileDepth);
      
      // Account for passed nonTileOffset - a local coordinate indicating the center base of the display object that will use these screen coords
      if( typeof nonTileOffset !== "undefined" ) {
        screenCoords.x += (this.tileWidth / 2) - nonTileOffset.x;
        screenCoords.y += (this.tileImgHeight - this.tileHeight / 2 - this.tileDepth) - nonTileOffset.y; 
      }

      return screenCoords;
    }

    // screenToGridCoords(createjs.Point screenXY, GridXYZ depthFocusXY (optional), bool clickTranslation (optional))
    // Returns a GridXYZ component with the grid coordinates of the tile drawn at the stage position screenXY. 
    // As elevation may cause a screen coordinate to relate to multiple tiles, due to higher elevation tiles obscuring those behind it, the optional depthFocusXY 
    // grid coordinates allow for indicating at what 'depth' into the grid tiles should be considered, so tiles known to be in front of a potential mapping can be ignored.
    // clickTranslation indicates if this mapping is a direct screen to grid mapping where elevation can be ignored
    this.screenToGridCoords = function(screenXY, depthFocusXY, clickTranslation) {
      var gridCoords;
      // For click translations, or situations where no heightmap data has been initialized, perform basic screen to base tile translation
      if( clickTranslation == true || typeof _heightmap === "undefined") {
        if( clickTranslation == true ) {
          // Account for tile image empty space
          screenXY.y -= (this.tileImgHeight - this.tileHeight);
        }
        // Calculate basic isometric translation
        gridCoords = new GridXYZ();
        gridCoords.x = Math.floor( ((2 / this.tileHeight) * (screenXY.y) + (2 / this.tileWidth) * (screenXY.x)) / 2 );
        gridCoords.y = Math.floor( ((2 / this.tileWidth) * (screenXY.x) - (2 / this.tileHeight) * (screenXY.y)) / 2 );
        gridCoords.z = 0;
      }
      else { // Determine grid coordinates accounting for actual map elevation data
        var depthFocused = (typeof depthFocusXY !== "undefined" ); // Are we focusing on tiles pass a certain depth, ignoring tiles that would otherwise obscure
        
        // Prepare buffer stage: clear all if conversion is depth depthFocused, o/w render all
        var child;
        for( var i = 0; i < _heightmapBufferStage.getNumChildren(); i++ ) {
          child = _heightmapBufferStage.getChildAt(i);
          child.sourceRect = _bufferTileEdgeRect;
          if( depthFocused == true ) {
            child.alpha = 0;
          } 
          else {
            child.alpha = 1;
          }
        }
        
        // If depth focused, prepare select tiles at appropriate depth for rendering on the buffer
        // We only want to look at tiles immediately behind the depth focus. Tiles in front could only obscure, more distant tiles are outside the focus.
        if( depthFocused == true ) {
         for( var x = depthFocusXY.x - 1; x <= depthFocusXY.x; x++ ) {
            if( typeof _bufferLookupTable[x] === "undefined" ) { continue; }
            for( var y = depthFocusXY.y; y <= depthFocusXY.y + 1; y++ ) {
              if( typeof _bufferLookupTable[x][y] === "undefined" ) { continue; }
              // Set buffer tile as visible, and determine which buffer tiles should use the 'full tile' sprite to account for elevation changes when the 
              // side of the tile is reached
              _bufferLookupTable[x][y].alpha = 1;
              if( _heightmap[x][y].get( GridXYZ ).z > depthFocusXY.z ) {
                _bufferLookupTable[x][y].sourceRect = _bufferTileFullRect;
              }
              else if( _heightmap[x][y].get( GridXYZ ).z < depthFocusXY.z ) {
                _bufferLookupTable[depthFocusXY.x][depthFocusXY.y].sourceRect = _bufferTileFullRect;
              }
            }
          }
        }

        // Search for display object at screen coordinates in buffer
        _heightmapBufferStage.update();
        var displayObject = _heightmapBufferStage.getObjectUnderPoint(screenXY.x, screenXY.y);
        // Check results
        if( (displayObject != null) && ('gameEntity' in displayObject) ) {
          // Buffer object representing an actual game tile is present at screenXY. gridCoords found.        
          gridCoords = displayObject.gameEntity.get( GridXYZ );
        }
        else if( depthFocused == true ) { 
          // No tile found. screenXY may be in front of the depth focus point.
          // Draw tiles in front of depth point and re-check buffer
          var currHeight = _heightmap[depthFocusXY.x][depthFocusXY.y].get( GridXYZ ).z;
          if( this.validTileCoords(depthFocusXY.x + 1, depthFocusXY.y) ) {
            _bufferLookupTable[depthFocusXY.x + 1][depthFocusXY.y].alpha = 1;
            var testHeight = _heightmap[depthFocusXY.x + 1][depthFocusXY.y].get( GridXYZ ).z;
            if( testHeight != currHeight ) {
              _bufferLookupTable[depthFocusXY.x + 1][depthFocusXY.y].sourceRect = _bufferTileFullRect;
              if( testHeight < currHeight ) {
                _bufferLookupTable[depthFocusXY.x][depthFocusXY.y].sourceRect = _bufferTileFullRect;
              }
            }
          }
          if( this.validTileCoords(depthFocusXY.x, depthFocusXY.y - 1) ) {
            _bufferLookupTable[depthFocusXY.x][depthFocusXY.y - 1].alpha = 1;
            var testHeight = _heightmap[depthFocusXY.x][depthFocusXY.y - 1].get( GridXYZ ).z;
            if( testHeight != currHeight ) {
              _bufferLookupTable[depthFocusXY.x][depthFocusXY.y - 1].sourceRect = _bufferTileFullRect;
              if( testHeight < currHeight ) {
                _bufferLookupTable[depthFocusXY.x][depthFocusXY.y].sourceRect = _bufferTileFullRect;
              }
            }
          }
          // This isn't perfect, but is meant to fix a depth problem at corners. Perfect system would have to adjust screenY when mapping a step down.
          // I think that would require independent display objects for the top and sides of a tile, with special logic when we are in a side.
          // Worth pursuing down the road, but this is good enough for now.
          if( this.validTileCoords(depthFocusXY.x + 1, depthFocusXY.y - 1) && _heightmap[depthFocusXY.x+1][depthFocusXY.y-1].get(GridXYZ).z == depthFocusXY.z ) {
            _bufferLookupTable[depthFocusXY.x + 1][depthFocusXY.y - 1].alpha = 1;
          }
          // Search again in updated buffer 
          _heightmapBufferStage.update();
          displayObject = _heightmapBufferStage.getObjectUnderPoint(screenXY.x, screenXY.y);
          if( (displayObject != null) && ('gameEntity' in displayObject) ) {
            gridCoords = displayObject.gameEntity.get( GridXYZ );
          }
        }
      }

      return gridCoords;
    }

    // Heightmap Interface

    // setHeightmap(Array, CameraEntity)
    // Initializes IsoHelper internal data used for heightmap lookups and coordinate translations
    this.setHeightmap = function(heightmapArray, mapCamera) {
      _heightmap = heightmapArray;
      _heightmapBufferCamera = mapCamera;

      // Create a stage for the heightmap buffer if it hasn't been done yet
      if( typeof _heightmapBufferStage === "undefined" ) {
        var canvas = document.createElement("canvas");
        _heightmapBufferStage = new createjs.Stage(canvas);
      }
      // Clear buffer in case it has been in use of an old heightmap
      _heightmapBufferStage.removeAllChildren();

      // Add heightmap tiles to buffer stage used in screen to grid lookups
      for( var x = 0; x < heightmapArray.length; x++ ) {
        if( typeof heightmapArray[x] === "undefined" ) {
          continue;
        }
        for( var y = heightmapArray[x].length - 1; y >= 0; y-- ) {
          if( typeof heightmapArray[x][y] == "undefined" ) {
            continue;
          }
          _addToHeightmapBufferStage(heightmapArray[x][y]);
        }
      }
    }

    // addToHeightmap(Entity tile)
    // Updates the heightmap to reflect a newly created tile
    this.addToHeightmap = function(tile) {
      // Log warning + return if called before heightmap initialization
      if( typeof _heightmap === "undefined" ) {
        console.log("Cannot add to an un-initialized heightmap.");
        return;
      }
      // Create new column in heightmap if needed
      var gridXYZ = tile.get(GridXYZ);
      if( typeof _heightmap[gridXYZ.x] === "undefined" ) {
        _heightmap[gridXYZ.x] = new Array();
      }
      // Remove previous heightmap entry if eleveation is being increased
      if( typeof _heightmap[gridXYZ.x][gridXYZ.y] !== "undefined" ) {
        var oldTile = _heightmap[gridXYZ.x][gridXYZ.y];
        _removeFromHeightmapBufferStage(oldTile);
      }
      // Update heightmap and buffer stage
      _heightmap[gridXYZ.x][gridXYZ.y] = tile;
      _addToHeightmapBufferStage(tile);
    }

    // removeFromHeightmap(ash/Game game, Entity tile)
    // Updates the heightmap to reflect removed tile
    this.removeFromHeightmap = function(game, tile) {
      // Log warning and return if called before heightmap has been initialized
      if( typeof _heightmap === "undefined" ) {
        console.log("Cannot remove from an un-initialized heightmap.");
        return;
      }

      // Get tile position and ensure location is in the heightmap
      var gridXYZ = tile.get(GridXYZ);
      if( typeof _heightmap[gridXYZ.x] === "undefined" || typeof _heightmap[gridXYZ.x][gridXYZ.y] === "undefined" ) {
        console.log("Removed tile is not in heightmap.")
        return;
      }

      // Remove from heightmap only if this is the 'top' tile at the location
      var currHeight = _heightmap[gridXYZ.x][gridXYZ.y].get(GridXYZ).z;
      if( currHeight != 0 ) {
        if( currHeight == gridXYZ.z ) {
          // this is the top tile, and the heightmap should be updated to include the next lowest tile
          var newHeight = currHeight - 1;
          var tileNodes = game.getNodeList( EditorTileNode );
          // find next lowest tile. This could be improved. Tiles should really have a reference to other tiles in their stack (+likely their neighbors)
          for( var i = 0; i < tileNodes.length(); i++ ) {
            var node = tileNodes.at(i);
            if( node.gridXYZ.x == gridXYZ.x && node.gridXYZ.y == gridXYZ.y && node.gridXYZ.z == newHeight ) {
              _heightmap[gridXYZ.x][gridXYZ.y] = node.editorData.entity;
              _removeFromHeightmapBufferStage(tile);
              _addToHeightmapBufferStage(node.editorData.entity);
              break;
            }
          }
        }
      }
      else {
        // we are removing the last, lowest, tile. Remove location from heighmap entirely.
        delete _heightmap[gridXYZ.x][gridXYZ.y];
        _removeFromHeightmapBufferStage(tile);
      }
    }

    // tick(int time)
    // Should be attached to game ticker to keep internal heightmap lookup data up to date
    this.tick = function(time) {
      if( typeof _heightmapBufferStage === "undefined" || typeof _heightmapBufferCamera === "undefined" ) {
        return; // Only necessary if we're using a heightmap buffer tied to a game camera
      }

      var camPos = _heightmapBufferCamera.get(Position);
      _heightmapBufferStage.x = -1 * camPos.x;
      _heightmapBufferStage.y = -1 * camPos.y;
    }

    // Utility Functions

    // getTileEntityAt(int gridX, int gridY)
    // Returns the tile entity representing the topmost grid tile at position gridX, gridY
    this.getTileEntityAt = function(gridX, gridY) {
      if( typeof _heightmap === "undefined" || !this.validTileCoords(gridX, gridY) ) { 
        return; // Heightmap has not been intialized or gridX, gridY is an invalid grid position
      }
      return _heightmap[gridX][gridY];
    }

    // validTileCoords(int gridX, int gridY)
    // Returns true/false indiciating whether a valid tile is present at the passed grid coordinates
    this.validTileCoords = function(gridX, gridY) {
      if( typeof _heightmap === "undefined" ) {
        return false;
      }
      return (typeof _heightmap[gridX] !== "undefined") && (typeof _heightmap[gridX][gridY] !== "undefined");
    }

    // updateDisplayOrder(Entity tileEntity, createjs.Stage stage)
    // Updates stage display list ordering to correctly layer tileEntity in the scene
    this.updateDisplayOrder = function(tileEntity, stage) {
      // Find the tile immediately before this one
      var gridXYZ = tileEntity.get(GridXYZ);
      var prevTile;
      var y = gridXYZ.y + 1;
      for( var x = gridXYZ.x; x >= 0; x-- ) {
        if( typeof _heightmap[x] === "undefined" ) {
          continue;
        }
        for( y; y < _heightmap[x].length; y++ ) {
          prevTile = this.getTileEntityAt(x, y);
          if( typeof prevTile !== "undefined" ) {
            // Move tileEntity to display after previous tile
            this.displayAfterTile(tileEntity, prevTile, stage);
            return;
          }
        }
        y = 0;
      }

      // Log warning. Tile display order should have been updated. Correct position was not found.
      console.log("Warning: Tile order not updated.");
    }

    // displayAfterTile(Entity entity, Entity tile, createjs.stage Stage)
    // Change entity's display list index for stage to draw immediately after  tile
    this.displayAfterTile = function(entity, tile, stage) {
      stage.removeChild(entity.get(Display).displayObject);
      var newIndex = stage.getChildIndex( tile.get(Display).displayObject ) + 1;
      stage.addChildAt(entity.get(Display).displayObject, newIndex);
    }

    // toJSON()
    // Returns current map data encoded as a JSON string
    this.toJSON = function() {
      // Can only export map data if the IsoHelper heightmap has been intitalized
      if( typeof _heightmap === "undefined" ) {
        alert("Only works when we have a heightmap!");
        return;
      }
      // Iterate through map and encode data
      var mapData = new Array();
      for( var x = 0; x < _heightmap.length; x++ ) {
        if( typeof _heightmap[x] === "undefined" ) {
          continue;
        }
        for( var y = _heightmap[x].length; y >= 0; y-- ) {
          if( typeof _heightmap[x][y] === "undefined" ) {
            continue;
          }    
          var tile = _heightmap[x][y];
          tileData = Object.create(null);
          tileData.gridXYZ = tile.get(GridXYZ);
          tileData.type = tile.get(Tile).type;
          mapData.push(tileData);
        }
      }
      return JSON.stringify(mapData);
    }

    // entityDistanceFromTileCenter(Entity entity, Entity tile)
    // Returns distance in screen units of entity from the center point of tile
    this.entityDistanceFromTileCenter = function(entity, tile) {
      var tileCenter = new createjs.Point(tile.get(Position).x, tile.get(Position).y);
      tileCenter.x += TileData.tileWidth / 2;
      tileCenter.y += TileData.tileImgHeight - (TileData.tileHeight / 2) - TileData.tileDepth;

      var entityPosition = new createjs.Point( entity.get(Position).x, entity.get(Position).y );
      entityPosition.x += entity.get(GridMapping).offset.x;
      entityPosition.y += entity.get(GridMapping).offset.y;

      var xDiff = Math.abs(entityPosition.x - tileCenter.x);
      var yDiff = Math.abs(entityPosition.y - tileCenter.y);
      var distance = Math.sqrt( Math.pow(xDiff, 2) + Math.pow(yDiff, 2));

      return distance;
    }

    // gridDistanceBetween(Entity entityA, Entity entityB)
    // Returns number of grid tiles separating two entities
    this.gridDistanceBetween = function(entityA, entityB) {
      var gridPosA = entityA.get(GridXYZ);
      var gridPosB = entityB.get(GridXYZ);
      return Math.sqrt( Math.pow(gridPosA.x - gridPosB.x, 2) + Math.pow(gridPosA.y - gridPosB.y, 2) );
    } 

    // A* Path Finding

    // findPath(Entity startTile, Entity endTile, bool logResults = false)
    // Uses the A* pathfinding algorithm to find the shortest path between startTile and endTile. 
    // If logResults is true, debug logging will be written to the console.
    this.findPath = function(startTile, endTile, logResults) {
      logResults = typeof logResults === "undefined" ? false : logResults;
      var goalCoords = endTile.get(GridXYZ);

      var checked = new Array();          // The set of nodes already evaluated.
      var open = [startTile];                 // The set of tentative nodes to be evaluated, initially containing the start node
      var cameFrom = Object.create(null); // Map of navigated nodes
   
      var costs = Object.create(null);
      costs[startTile.id] = 0;
      var goalEstimates = Object.create(null);
      goalEstimates[startTile.id] = this.gridDistanceBetween(startTile, endTile);

      while( open.length != 0 ) {
        // Sort from lowest estimated score (f) to highest
        open.sort( _sortAStarSet(goalEstimates) );
        var current = open.shift(); // remove and use node with lowest estimatedToGoal score
        checked.push(current); // add to checked set

        if( logResults ) {
          console.log( "checking " + current.get(GridXYZ).x + ", " + current.get(GridXYZ).y );
        }

        if( current == endTile ) { // Shortest path has been found, reconstruct and return it
          var path = _reconstructPath(cameFrom, endTile);
          if( logResults ) {
            console.log("Path found:");
            for( var k in path ) {
              console.log(path[k].get(GridXYZ).x + ", " + path[k].get(GridXYZ).y);
            }
          }
          return path;
        }

        // Calculate costs of next set of neighbors
        var neighbors = _getTileNeighbors(current); // returns traversible neighbors
        for( var idx in neighbors ) {
          var neighbor = neighbors[idx];
          if( checked.indexOf(neighbor) != -1 ) {
            // Neighbor has already been evaluated
            continue;
          }
          var tentativeScore = costs[current.id] + this.gridDistanceBetween(current, neighbor);
          if( open.indexOf(neighbor) == -1 || tentativeScore <= costs[neighbor.id] ) {
            cameFrom[neighbor.id] = current;
            costs[neighbor.id] = tentativeScore;
            goalEstimates[neighbor.id] = tentativeScore + this.gridDistanceBetween(neighbor, endTile);
            if( open.indexOf(neighbor) == -1 ) {
              open.push(neighbor);
            }
          }
        }
      }

      // Failed to find a solution
      if( logResults ) {
        console.log("No path found.");
      }
      return [];
    }

    // Private Functions

    // _addToHeightmapBufferStage(Entity tile)
    // Adds a new display object to the buffer stage to represent the passed tile, and updates the buffer object lookup table
    var _addToHeightmapBufferStage = function(tile) {
      var gridXYZ = tile.get(GridXYZ);

      var bufferObject = _bufferTile.clone();
      bufferObject.gameEntity = tile; 
      bufferObject.sourceRect = _bufferTileFullRect;

      var placement = _self.gridToScreenCoords(gridXYZ);
      bufferObject.x = placement.x;
      bufferObject.y = placement.y;
      
      var gridXYZ = tile.get(GridXYZ);
      if( typeof _bufferLookupTable[gridXYZ.x] === "undefined" ) {
        _bufferLookupTable[gridXYZ.x] = new Array();
      }
      _bufferLookupTable[gridXYZ.x][gridXYZ.y] = bufferObject;
      _heightmapBufferStage.addChild( bufferObject );
    }

    // _removeFromHeightmapBufferStage(Entity tile)
    // Removes display object representing the passed tile from the buffer stage, and updates the buffer object lookup table
    var _removeFromHeightmapBufferStage = function(tile) {
      var gridXYZ = tile.get(GridXYZ);
      var bufferObject = _bufferLookupTable[gridXYZ.x][gridXYZ.y];
      _heightmapBufferStage.removeChild( bufferObject );
      delete _bufferLookupTable[gridXYZ.x][gridXYZ.y];
    }

    // _sortAStarSet(dictionary goalEstimates)
    // sorts a set of nodes in consideration by A* from lowest to highest goal estimate, provided in the goalEsitamtes dictionary object
    var _sortAStarSet = function(goalEstimates) {
      return function(nodeA, nodeB) {
        return goalEstimates[nodeA.id] - goalEstimates[nodeB.id];
      }
    }

    // _getTileNeighbors(Entity homeTile, boolean includeDiagonals = false)
    // Returns an array of tile entities that are neighbors with homeTile, including diagonal neighbors if includeDiagonals is true
    var _getTileNeighbors = function(homeTile, includeDiagonals) {
      includeDiagonals = typeof includeDiagonals === "undefined" ? false : includeDiagonals;
      var neighbors = new Array();

      var tile;
      var xyz = homeTile.get(GridXYZ);
      for( var x = xyz.x - 1; x <= xyz.x + 1; x++ ) {
        for( var y = xyz.y - 1; y <= xyz.y + 1; y++ ) {
          if( !includeDiagonals && x != xyz.x && y != xyz.y ) {
            continue;
          }
          tile = _self.getTileEntityAt(x, y);
          if( typeof tile === "undefined" || tile == homeTile ) {
            continue;
          }
          if( tile.get(Tile).walkable == false ) {
            continue;
          }
          if( Math.abs(tile.get(GridXYZ).z - homeTile.get(GridXYZ).z) > 1 ) {
            continue;
          }
          neighbors.push(tile);
        }
      }

      return neighbors;
    }
   
    // _reconstructPath(Entity cameFromTile, Entity currentTile)
    // Recursively builds a start to finish path that has been sucesfully processed by A*
    // Returns sorted array of tile entities indiciating the path
    var _reconstructPath = function(cameFromTile, currentTile) {
      if( currentTile.id in cameFromTile ) {
        var path = _reconstructPath(cameFromTile, cameFromTile[currentTile.id] );
        path.push(currentTile);
        return path;  
      }
      else {
        return [currentTile];
      }
    }
  }

  return IsoHelper;
});