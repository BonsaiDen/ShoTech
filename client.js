/*global Class, Twist, ObjectList, Input, Keys */
var canvas = document.getElementById('game'),
    context = canvas.getContext('2d'),
    input = new Input();

input.bind(canvas);

var NetworkEntity = Class(function(x, y, r) {

    this.x = x;
    this.y = y;
    this.r = r;
    this.mx = 0;
    this.my = 0;
    this.mr = 0;

    this.states = [];
    this.maxStates = 30;

    this.interp = {
        x: this.x,
        y: this.y,
        r: this.r,
        mx: this.mx,
        my: this.my,
        mr: this.mr
    };

}, {

    update: function(tick, t, dt) {

        // Serialize a new state
        this.states.push([tick, dt, this.serializeState()]);

        // Drop old states
        if (this.states.length > this.maxStates) {
            this.setState(tick - this.maxStates);
            this.states.shift();
        }

    },

    serializeState: function() {
        return [];
    },

    setState: function(untilTick) {
        this.interpolateState(untilTick, this);
    },

    interpolateState: function(untilTick, target) {

        target.x = this.x;
        target.y = this.y;
        target.r = this.r;

        target.mx = this.mx;
        target.my = this.my;
        target.mr = this.mr;

        for(var i = 0, l = this.states.length; i < l; i++) {

            var s = this.states[i];
            if (s[0] > untilTick) {
                break;
            }

            this.applyState.call(target, s[1], s[2]);

        }

    },

    applyState: function(dt, state) {
    }

});


var NetworkPlayer = Class(function() {

    NetworkEntity(this, 128, 128, 0);
    this.interp = {};

}, NetworkEntity, {

    serializeState: function() {
        return [input.isDown(Keys.A), input.isDown(Keys.D), input.isDown(Keys.W)];
    },

    applyState: function(dt, state) {

        var mr = 0;
        if (state[0]) {
            mr = 0.1 * dt;

        } else if (state[1]) {
            mr = -0.1 * dt;
        }

        this.mr = mr;
        this.r += mr;

        if (state[2]) {
            this.mx += Math.sin(this.r) * 0.19 * dt;
            this.my += Math.cos(this.r) * 0.19 * dt;
        }

        var maxSpeed = 3 * dt,
            r = Math.atan2(this.mx, this.my);

        var speed = Math.sqrt(Math.pow(this.x - (this.x + this.mx), 2)
                            + Math.pow(this.y - (this.y + this.my), 2));

        if (speed > maxSpeed) {
            speed = maxSpeed;
        }

        this.mx = Math.sin(r) * speed;
        this.my = Math.cos(r) * speed;

        this.x += this.mx;
        this.y += this.my;

    },

    render: function(t, dt, u, tick) {

        this.interpolateState(tick, this.interp);

        context.save();
        context.translate(this.interp.x + this.interp.mx * u, this.interp.y + this.interp.my * u);
        context.rotate(Math.PI - (this.interp.r + this.interp.mr * u));
        context.lineWidth = 3;

        context.beginPath();
        context.moveTo(0, -12);
        context.lineTo(10, 12);
        context.lineTo(-10, 12);
        context.lineTo(0, -12);
        context.closePath();
        context.stroke();
        context.restore();

    }

});



var Client = Class(function(update, render) {

    Twist(this, 30, 60);


    this.delay = 50;
    this.tick = 0;

    this.players = new ObjectList();
    this.players.add(new NetworkPlayer());

}, Twist, {

    _update: function(t, dt) {
        this.update(t, dt / 34);
    },

    update: function(t, dt) {

        this.tick++;
        this.players.each(function(player) {
            player.update(this.tick, t, dt);

        }, this);

        input.update();

    },

    render: function(t, dt, u) {
        context.fillRect(0, 0, canvas.width, canvas.height);

        this.players.each(function(player) {
            context.strokeStyle = '#d0a0a0';
            player.render(t, dt, u, this.tick - 15);

            context.strokeStyle = '#d00000';
            player.render(t, dt, u, this.tick);

        }, this);
    }

});

new Client().start();

