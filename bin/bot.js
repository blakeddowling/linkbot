// bin/bot.js

'use strict';

var NorrisBot = require('../lib/norrisbot');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var norrisbot = new NorrisBot({
    token: token,
    //xoxb-18871455559-ZJJSWXUQYkaYEXwr1ZeUkIsP
    dbPath: dbPath,
    name: name
});

norrisbot.run();