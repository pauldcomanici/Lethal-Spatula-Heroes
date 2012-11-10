(function() {

    //
    // Some useful components for platform games -- imrpoved versions of Gravity and Twoway
    //
    /**@
    * #PlatformerGravity
    * @category 2D
    * Adds gravitational pull to the entity - with adjustments to be more like a platform game!
    */
    Crafty.c("PlatformerGravity", {
        _gravityConst: 0.2,
        _gy: 0,
        _falling: true,
        _anti: null,
        _deltaX: 0,
        _deltaY: 0,

        init: function () {
            this.requires("2D");
        },

        /**@
        * #.gravity
        * @comp Gravity
        * @sign public this .gravity([comp])
        * @param comp - The name of a component that will stop this entity from falling
        * 
        * Enable gravity for this entity no matter whether comp parameter is not specified, 
        * If comp parameter is specified all entities with that component will stop this entity from falling.
        * For a player entity in a platform game this would be a component that is added to all entities
        * that the player should be able to walk on.
        * 
        * @example
        * ~~~
        * Crafty.e("2D, DOM, Color, Gravity")
        *    .color("red")
        *    .attr({ w: 100, h: 100 })
        *    .gravity("platform")
        * ~~~
        */
        platformerGravity: function (comp) {
            if (comp) this._anti = comp;

            this.bind("EnterFrame", this._enterFrame);

            return this;
        },

        /**@
        * #.gravityConst
        * @comp Gravity
        * @sign public this .gravityConst(g)
        * @param g - gravitational constant
        * 
        * Set the gravitational constant to g. The default is .2. The greater g, the faster the object falls.
        * 
        * @example
        * ~~~
        * Crafty.e("2D, DOM, Color, Gravity")
        *   .color("red")
        *   .attr({ w: 100, h: 100 })
        *   .gravity("platform")
        *   .gravityConst(2)
        * ~~~
        */
        gravityConst: function(g) {
            this._gravityConst=g;
            return this;
        },

        _enterFrame: function () {
            if (this._falling) {
                //if falling, move the players Y
                this._gy += this._gravityConst;
                this.y += this._gy;
                this._deltaY += this._gy;
            } else {
                this._gy = 0; //reset change in y
            }

            var obj, hit = false, pos = this.pos(),
                q, i = 0, l;

            //Increase by 1 to make sure map.search() finds the floor
            pos._y++;

            //map.search wants _x and intersect wants x...
            pos.x = pos._x;
            pos.y = pos._y;
            pos.w = pos._w;
            pos.h = pos._h;

            q = Crafty.map.search(pos);
            l = q.length;

            for (; i < l; ++i) {
                obj = q[i];
                //check for an intersection directly below the player
                if (obj !== this && obj.has(this._anti) && obj.intersect(pos)) {
                    hit = obj;
                    break;
                }
            }

            if (hit) { //stop falling if found
                if (this._falling) this.stopFalling(hit);
            } else {
                this._falling = true; //keep falling otherwise
            }

            this._deltaX = 0;
            this._deltaY = 0;
        },

        stopFalling: function (e) {
            
            //this._gy = -1 * this._bounce;
            this._falling = false;
            if (this._up) this._up = false;

            if (e) {
                if (e._y > this.y) {
                    // hit top of platform
                    this.y = e._y - this._h; //move object
                } else {
                    // hit bottom of platform
                    this.y = e._y + e._h;
                    this._gy = 0;
                    this._falling = true;
                }
            }

            this.trigger("hit");        
        },

        /**@
        * #.antigravity
        * @comp Gravity
        * @sign public this .antigravity()
        * Disable gravity for this component. It can be reenabled by calling .gravity()
        */
        antigravity: function () {
            this.unbind("EnterFrame", this._enterFrame);
        }
    });

/**@
* #PlatformerControls
* @category Input
* Move an entity left or right using the arrow keys or `D` and `A` and jump using up arrow or `W`.
*
* When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}. This is consistent with Fourway and Multiway components.
* When entity has moved on x-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
*/
Crafty.c("PlatformerControls", {
    _speed: 3,
    _up: false,

    init: function () {
        this.requires("Fourway, Keyboard");
    },

    /**@
    * #.twoway
    * @comp PlatformerControls
    * @sign public this .twoway(Number speed[, Number jumpSpeed])
    * @param speed - Amount of pixels to move left or right
    * @param jumpSpeed - How high the entity should jump
    * 
    * Constructor to initialize the speed and power of jump. Component will
    * listen for key events and move the entity appropriately. This includes
    * ~~~
    * `Up Arrow`, `Right Arrow`, `Left Arrow` as well as W, A, D. Used with the
    * `gravity` component to simulate jumping.
    * ~~~
    * 
    * The key presses will move the entity in that direction by the speed passed in
    * the argument. Pressing the `Up Arrow` or `W` will cause the entity to jump.
    * 
    * @see Gravity, Fourway
    */
    platformerControls: function (speed, jump) {

        this.multiway(speed, {
            RIGHT_ARROW: 0,
            D: 0
        });

        if (speed) this._speed = speed;
        jump = jump || this._speed * 2;

        this.bind("EnterFrame", function () {
            if (this.disableControls) return;
            if (this._up) {
                this.y -= jump;
                this._deltaY = -jump;
                this._falling = true;
            }
        }).bind("KeyDown", function () {
            if (this.isDown("UP_ARROW") || this.isDown("W") || this.isDown("Z")) this._up = true;
        }).bind("Moved", function(oldpos) {
            this._deltaX = this._x - oldpos.x;
        });

        return this;
    }
});
    
})();