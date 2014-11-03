//
// systems/EditorSystem
// Handles UI and entity interaction for the mouse based map editor
//

define(["nodes/EditorTileNode", "systems/CameraMovementSystem", "components/Camera", "components/Position", "components/Tile", "components/GridXYZ", "components/Display", "TileData", "ash/System"], function(EditorTileNode, CameraMovementSystem, Camera, Position, Tile, GridXYZ, Display, TileData, ashSystem) {
  
  function EditorSystem(entityCreator, mapHelper, controlsDOM) {
  
    // Private Properties

    var _editableTiles;

    var _creator = entityCreator;
    var _mapHelper = mapHelper;
    var _stages = Object.create(null);
    var _focuStage = null;

    var _controls = $(controlsDOM);

    var _clickHandled = false;
    var _activeTool = 'addTileTool';
    var _selectedTile = null;

    var _self = this;

    // System Functions

    this.setup = function(game) {
      // Get reference to editable tiles handled by the EditorTileNode list, initialize click handlers for all tiles, and set up
      // subscription to initalize click handlers on tiles added later
      _editableTiles = game.getNodeList( EditorTileNode );
      for( var i = 0; i < _editableTiles.length(); i++ ) {
        _initTileClickHandlers( _editableTiles.at(i) );
      }
      _editableTiles.addSubscriber('nodeAdded', _initTileClickHandlers);

      // Load + bind controls in DOM 
      _controls.load("springling/views/editorControls.html", function() {
        // Enable inital tool 
        _switchTool(_activeTool);
        // Setup tool lists
        _controls.find("#toolList li").click(function(e) { 
          e.preventDefault();
          _switchTool( $(this).find('a').data('tooltype') );
        });

        // Setup tile type drop downs
        var newTileTypeSelect = _controls.find("#newTileType");
        var editTileTypeSelect = _controls.find("#selectedTileType");
        var changeTileTypeSelect = _controls.find("#changeTileType");
        for( type in TileData.templates ) {
          var option = $('<option>', { 
            value: type,
            text : type 
          });
          newTileTypeSelect.append(option.clone());
          editTileTypeSelect.append(option.clone());
          changeTileTypeSelect.append(option.clone());
        }
        editTileTypeSelect.change( _changeSelectedTileType );
        newTileTypeSelect.change( _restoreFocus );
        changeTileTypeSelect.change( _restoreFocus );
        
        // Setup tool buttons
        _controls.find("#destroySelectedTile").click( _destroySelectedTile );
      });
    }

    this.update = function(time) {
      // Event based. Handled with click handlers
    }

    this.detach = function(game) {
      // Remove tile click handlers + stage click handlers
      var tileNode;
      var stage;
      for( var i = 0; i < _editableTiles.length(); i++ ) {
        tileNode = _editableTiles.at(i);
        tileNode.display.displayObject.onClick = null;

        stage = tileNode.display.camera.get(Camera).stage;
        if( stage in _stages ) {
          stage.canvas.removeEventListener('click', _stages[stage]);
          delete _stages[stage];
        }
      }
            
      _editableTiles.removeSubscriber('nodeAdded', _initTileClickHandlers);
      _editableTiles = null;

      _stages = null;
      _focuStage = null;

      // Unbind DOM controls
      _controls.find("#toolList li").off();
      editTileTypeSelect.off();
      _controls.find("#destroySelectedTile").off();
    }

    // Private Functions

    // initTileClickHandlers(EditorTileNode tile)
    // Sets up editor click handlers for this tile
    var _initTileClickHandlers = function(tile) {
      // Check if tiles stage has already had its click handler initialized
      var stage = tile.display.camera.get(Camera).stage;
      if( stage in _stages == false ) {
        var handler = _stageClickHandler(stage);
        stage.canvas.addEventListener('click', handler);
        _stages[stage] = handler;
        if( _focuStage == null) {
          _focuStage = stage;
        }
      }
      // Bind tile click handler
      tile.display.displayObject.onClick = _tileClickHandler(tile.editorData);
    }

    // _stageClickHandler(createjs.Stage stage)
    // Returns handler for clicks onto empty space on the stage, where no tiles are present
    var _stageClickHandler = function(stage) {
      // Using closure to pass data to a callback
      return function(mouseEvent) {
        // The only tool that has an effect on empty stage space is add tile
        if( _activeTool != "addTileTool" ) {
          return; // Nothing to do.
        }

        // Only act if this click hasn't already been handled by a higher priority handler.
        // Namely, the tileClickHandler
        if( _clickHandled == false ) {
          // Convert mouse event coordinates to screen coordinates
          var canvas = $(mouseEvent.srcElement);
          var screenPos = stage.globalToLocal(
            mouseEvent.pageX - canvas.offset().left,
            mouseEvent.pageY - canvas.offset().top
          );
          // Convert screen coordinates to grid position
          var clickTranslation = true;
          var gridXYZ = _mapHelper.screenToGridCoords(screenPos, undefined, clickTranslation);
          if( gridXYZ.x < 0 || gridXYZ.y < 0 ) {
            return; // Must build into positive grid space. Return for no-op.
          }
          // Create new tile of selected type at clicked grid position
          var tileType = _controls.find("#newTileType").val();
          var tile = _creator.createTile(gridXYZ.x, gridXYZ.y, gridXYZ.z, tileType);
          _mapHelper.updateDisplayOrder(tile, stage);
        }
        else {
          // Last click handler in priority (after tile clicks). Reset clickHandled for next event.
          _clickHandled = false;
        }
      }
    }

    // _tileClickHandler(components/EditorData editorData)
    // Returns handler for clicks on existing tiles
    var _tileClickHandler = function(editorData) {
      // Using closure to pass data to a callback
      return function() {
        _selectedTile = editorData.entity;
        switch( _activeTool ) {
          case 'eraseTileTool':
            _destroySelectedTile();
            break;
          case 'tileDataTool':
            var tileData = _selectedTile.get(Tile);
            var tilePos = _selectedTile.get(GridXYZ);
            var displayObject = _selectedTile.get(Display).displayObject;
            var htmlString = 'Position: ' + tilePos.x + ', ' + tilePos.y + ', ' + tilePos.z + '<br/>' +
              'Display SourceRect: ' + _selectedTile.get(Display).displayObject.sourceRect + '<br/>' + 
              'Display Index: ' + displayObject.getStage().getChildIndex(displayObject);
            htmlString += '<br/><br/>';

            _controls.find("#selectedTileData").html(htmlString);
            _controls.find("#selectedTileType").val(tileData.type).show();
            break;    
          case 'changeTileTool':
            var newType = _controls.find("#changeTileType").val();
            _changeSelectedTileType(newType);
            break;
          case 'addTileTool':
            var tilePos = _selectedTile.get(GridXYZ);
            var tileType = _controls.find("#newTileType").val();
            // Make new tile at location one elevation higher
            var newTile = _creator.createTile(tilePos.x, tilePos.y, tilePos.z + 1, tileType);
            _mapHelper.displayAfterTile(newTile, _selectedTile, newTile.get(Display).camera.get(Camera).stage);
            break;
        }
        // Mark click as handled to prevent _stageClickHandler from reacting
        _clickHandled = true;
        _restoreFocus();
      }
    }

    // _destroySelectedtile()
    // Removes currently selected tile from game and updates editor controls
    var _destroySelectedTile = function() {
      _creator.destroyTile(_selectedTile);
      _controls.find("#selectedTileData").html('None');
      _controls.find("#selectedTileType").hide();
      _restoreFocus();
    }

    // _changeSelectedTileType(string newType)
    // Changes currently selected tile type to newType
    var _changeSelectedTileType = function(newType) {
      if( typeof newType != "string" ) {
        // Then this is a JQuery callback
        newType = $(this).val();
      }
      _creator.changeTileType(_selectedTile, newType);
      _restoreFocus();
    }

    // _switchTool(string newToolType)
    // Updates controls and internal state to reflect change to new tool type
    var _switchTool = function(newToolType) {
      _controls.find("#"+_activeTool).hide();
      _controls.find("#"+newToolType).show();
      _activeTool = newToolType;
      _restoreFocus();
    }

    // _restoreGameFocus()
    // Returns keyboard focus to the first stage. Not a perfect solution for multiple reasons, but good enough for now.
    var _restoreFocus = function() {
      if( _focuStage != null ) {
        _focuStage.canvas.focus();
      }
    }
  }

  EditorSystem.prototype = new ashSystem();
  return EditorSystem;
});