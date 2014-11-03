requirejs.config({
    baseUrl: './springling/',
    shim: {
        easel: {
            exports: 'createjs'
        }
    },
    paths: {
        easel: 'easeljs-0.5.0.min',
        ash: 'ash/',
        components: 'components/',
        nodes: 'nodes/',
        systems: 'systems/'
    }
});

requirejs(["ash/Game", "IsoHelper", "EntityCreator", "systems/SystemPriorities", "systems/InputSystem", "systems/AISystem", "systems/CollisionSystem", "systems/CameraMovementSystem", "systems/MovementSystem", "systems/GridPlacementSystem", "systems/AnimationSystem", "systems/RenderSystem", "systems/EditorSystem", "easel"], 
function(ashGame, IsoHelper, EntityCreator, SystemPriorities, InputSystem, AISystem, CollisionSystem, CameraMovementSystem, MovementSystem, GridPlacementSystem, AnimationSystem, RenderSystem, EditorSystem) {
    // Prepare
    var canvas = document.getElementById("gameCanvas");
    // Default focus to game canvas on load
    canvas.tabIndex = 0;
    canvas.focus();

    var game = new ashGame();
    var isoHelper = new IsoHelper();
    var creator = new EntityCreator( game, isoHelper );

    // TODO: move into editor system or editor helper?
    var editorToggle = document.getElementById("editorToggle");
    var editorControls = document.getElementById("editor");
    editorToggle.onclick = function() {
        game.addSystem(new EditorSystem(creator, isoHelper, editorControls), 5);
    };

    game.addSystem( new InputSystem(canvas), SystemPriorities.first );
    game.addSystem( new AISystem(isoHelper), SystemPriorities.first );
    game.addSystem( new CollisionSystem(isoHelper), SystemPriorities.preventCollisions );
    game.addSystem( new CameraMovementSystem(isoHelper), SystemPriorities.move );
    game.addSystem( new MovementSystem(), SystemPriorities.move );
    game.addSystem( new GridPlacementSystem(isoHelper), SystemPriorities.update );
    game.addSystem( new AnimationSystem(), SystemPriorities.animate );
    game.addSystem( new RenderSystem(), SystemPriorities.render );

    creator.setupDemo(canvas);

    // Start Update Ticker
    createjs.Ticker.useRAF = true;
    createjs.Ticker.addListener(game.update);
    createjs.Ticker.addListener(isoHelper);
});
