// lib/norrisbot.js

'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var NorrisBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'linkcitybot';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db');

    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(NorrisBot, Bot);

NorrisBot.prototype.run = function () {
    NorrisBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onLinkMessage);
};

NorrisBot.prototype._onStart = function () {
    this._loadBotUser();
    this._connectDb();
    this._firstRunCheck();
};

NorrisBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

NorrisBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};

NorrisBot.prototype._firstRunCheck = function () {
    var self = this;
    
    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var currentTime = (new Date()).toJSON();

        // this is a first run
        if (!record) {
            self._welcomeMessage();
            return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
        }

        // updates with new last running time
        self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });
};

NorrisBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

NorrisBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromLinkBot(message) &&
        this._isMentioningChuckNorris(message)
    ) {
        this._replyWithRandomJoke(message);
    }
};

NorrisBot.prototype._onLinkMessage = function (message) {
    if (this._isChatMessage(message) &&
        this._isInMarketingChannel(message) &&
        !this._isFromLinkBot(message) &&
        this._containsLink(message)
    ) {
        this._directMessageBlake(message);
    }
};

// NEEDS: Change to the actual channel codes for C9
NorrisBot.prototype._isInMarketingChannel = function (message) {
    // var channel_code_growth_hacking = '';
    // var channel code_marketing = '';
    // var channel_code_water_cooler = '';
    var channel_code_random = 'C04U4E7JA';
    var channel_code_support_products = 'C04US9075';
    return typeof message.channel === 'string' &&
        message.channel === channel_code_random;
};

// goteem
NorrisBot.prototype._containsLink = function (message) {
    return message.text.toLowerCase().indexOf('http') > -1 ||
        message.text.toLowerCase().indexOf(this.user.id.toLowerCase()) > -1;
};

// CHANGEME
NorrisBot.prototype._directMessageBlake = function(originalMessage) {
    var self = this;
    // for actual C9 slack
    //self.postMessageToUser('blakedowling', originalMessage.text, {as_user: true});
    self.postMessageToUser('blakeddowling', originalMessage.text, {as_user: true});
};

NorrisBot.prototype._isChatMessage = function (message) {
    return (message.type === 'message' && Boolean(message.text) );
};

NorrisBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};

NorrisBot.prototype._isFromLinkBot = function (message) {
    return message.user === this.user.id;
};

NorrisBot.prototype._isMentioningChuckNorris = function (message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.user.id.toLowerCase()) > -1;
};

NorrisBot.prototype._replyWithRandomJoke = function (originalMessage) {
    var self = this;
    self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, record.joke, {as_user: true});
        self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    });
};

NorrisBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = NorrisBot;

