(function () {
    //
    // Components
    //
	
	//TODO: to @markltbaker
	var obstaclePosY = 330,
		obstacleHeight = 50,
		floorPosY = 0,
		myObstacles = [
			{x: 150, y: obstaclePosY, w: 5, h: obstacleHeight},
			{x: 250, y: obstaclePosY, w: 5, h: obstacleHeight},
			{x: 350, y: obstaclePosY, w: 5, h: obstacleHeight},
			{x: 450, y: obstaclePosY, w: 5, h: obstacleHeight},
			{x: 550, y: obstaclePosY, w: 5, h: obstacleHeight},
			{x: 650, y: obstaclePosY, w: 5, h: obstacleHeight},
			{x: 750, y: obstaclePosY, w: 5, h: obstacleHeight},
			{x: 850, y: obstaclePosY, w: 5, h: obstacleHeight}
		],
		myObstaclesLength = 0,
		manWidth = 50,
		manHeight = 100,
		startTime,
		myPlayer,
		gameEndPosX = 900,
		gameEnd = false;
	
	myObstaclesLength = myObstacles.length;
	floorPosY = obstaclePosY + obstacleHeight;
    // a renderable entity
    Crafty.c('Renderable', {
        init: function () {
            // we're using DOM Spirtes
            this.requires('2D, DOM');
        },
        // set which sprite to use -- should match up with a call to Crafty.sprite()
        spriteName: function (name) {
            this.requires(name);
            return this; // so we can chain calls to setup functions
        }
    });

    // Platform component
    Crafty.c('Platform', {
        init: function () {
            this.requires('Renderable, Collision, Color')
                .color('green');
        }
    });

    // Limit movement to within the viewport
    Crafty.c('ViewportBounded', {
        init: function () {
            this.requires('2D');
        },
        // this must be called when the element is moved event callback
        checkOutOfBounds: function (oldPosition) {
            if (!this.within(0, 0, Crafty.viewport.width, Crafty.viewport.height)) {
                this.attr({
                    x: oldPosition.x,
                    y: oldPosition.y
                });
            }
        }
    });
	
	// A component to display the player's time
    Crafty.c('Score', {
		transformInReadable: function () {
			var filteredTime,
				min,
				sec,
				c;
			filteredTime = parseInt(this.score / 1000, 10);
			if (isNaN(filteredTime) || filteredTime <= 0) {
				min = "00";
				sec = "00";
			} else {
				sec = filteredTime % 60;
				if (sec < 10) {
					sec = "0" + sec;
				}
				min = (filteredTime - sec) / 60;
				if (min < 10) {
					min = "0" + min;
				}
			}
			return min + ":" + sec; 
		},
        init: function() {
            startTime = (new Date()).valueOf();
            this.score = 0;
            this.requires('2D, DOM, Text');
            this._textGen = function() {
                return "Time: " + this.transformInReadable();
            };
            this.attr({w: 100, h: 20, x: 900, y: 0})
                .text(this._textGen);
        },
        // update the time - note how we call this.text() to change the text!
        update: function() {
			var currentTime = (new Date()).valueOf();
			
            this.score = currentTime - startTime;
            this.text(this._textGen);
			if (gameEnd) {
				alert("Done, you finished in " + this.transformInReadable());
			} else {
				this.timeout(myPlayer.setPlayerScore, 1000);
			}
        }
    })

    // Limit movement to within the viewport
    Crafty.c('Obstacles', {
        init: function () {
            this.requires('2D, DOM, Color, Collision').color("gray");
        }
    });

    // Player component    
    Crafty.c('Player', {
        init: function () {
            this.requires('Renderable, Delay, ViewportBounded, Collision, PlatformerGravity, PlatformerControls, Gravity')
                // set sprite
                .spriteName('man')
                // set starting position
                .attr({ x: 0, y: 200 })
                // set platform-style controller up with walk + jump speeds
                .platformerControls(5, 8)
                // enable gravity, stop when we hit 'Platform' components
                .platformerGravity('Platform')
				.gravityConst(0.1)
				.gravity("solid")
                // enable collision (not used by platformer gravity/controls but would be useful for other things)
                .collision();

            // bind our movement handler to keep us within the Viewport
            this.bind('Moved', function (oldPosition) {
                var hitted,
					i,
					realX;
				if (oldPosition.x > gameEndPosX) {
					gameEnd = true;
				} else {
					realX = oldPosition.x + manWidth;
					hitted = this.hit("Obstacles");
					if (hitted) {
						this.attr({
							x: oldPosition.x,
							y: oldPosition.y
						});
					}
					for (i = 0; i < myObstaclesLength; i = i + 1) {
						if (myObstacles[i].x > realX) {
							//don't loop for the next fence
							break;
						}
						if (myObstacles[i].x <= realX && realX <= (myObstacles[i].x + manWidth + myObstacles[i].w)) {
							if (oldPosition.y + manHeight >= obstaclePosY) {
								this.attr({
									x: (myObstacles[i].x - manWidth),
									y: oldPosition.y
								});
								break;
							}
						}
					}
				}
				this.checkOutOfBounds(oldPosition);
            });
			
			this.timeout(this.setPlayerScore, 1000);

            // we need to flip the sprite for each direction we are travelling in
            this.bind('NewDirection', function (direction) {
                if (direction.x > 0) {
                    this.flip()
                } else if (direction.x < 0) {
                    this.unflip()
                } 
            });
        },
		setPlayerScore: function () {
			var score = Crafty('Score');
            score.update();
		}
    });


    //
    // Game loading and initialisation
    //    
    var Game = function () {
            Crafty.scene('loading', this.loadingScene);
            Crafty.scene('main', this.mainScene);
        };

    Game.prototype.initCrafty = function () {
        //console.log("page ready, starting CraftyJS");
        Crafty.init(1000, 400);
        Crafty.canvas.init();

        Crafty.modules({
            //'crafty-debug-bar': 'release'
        }, function () {
            if (Crafty.debugBar) {
                Crafty.debugBar.show();
            }
        });
    };

    // A loading scene -- pull in all the slow things here and create sprites
    Game.prototype.loadingScene = function () {
        var loading = Crafty.e('2D, Canvas, Text, Delay');
        loading.attr({
            x: 512,
            y: 200,
            w: 100,
            h: 20
        });
        loading.text('loading...');

        function onLoaded() {
            // set up sprites
            Crafty.sprite('img/man.png', {
                man: [0, 0, manWidth, manHeight]
            });

            // jump to the main scene in half a second
            loading.delay(function () {
                Crafty.scene('main');
            }, 500);
        }

        function onProgress(progress) {
            loading.text('loading... ' + progress.percent + '% complete');
        }

        function onError() {
            loading.text('could not load assets');
        }

        // list of images to load
        Crafty.load(
        ['img/man.png'],
        onLoaded, onProgress, onError);

    };

    //
    // The main game scene
    //
    Game.prototype.mainScene = function () {
		var i;
        //create a player...
        myPlayer = Crafty.e('Player');

        //This is the floor
        Crafty.e('solid, Platform').attr({x: 0, y: floorPosY, w: 1000, h: 20});
		
		// create a scoreboard
        Crafty.e('Score');

        //These are obstacles
		for (i = 0; i < myObstaclesLength; i = i + 1) {
			Crafty.e('solid, Obstacles').attr(myObstacles[i]);
		}
    };

    // kick off the game when the web page is ready
    $(document).ready(function () {
        var game = new Game();
        game.initCrafty();

        // start loading things
        Crafty.scene('loading');

    });

}());