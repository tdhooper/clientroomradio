// Classes
var Backend = require("./lib/Backend.js");
var Chat = require("./lib/Chat.js");
var CurrentTrackManager = require("./lib/CurrentTrackManager.js");
var DataStore = require("./lib/DataStore.js");
var EndOfDayRequestManager = require("./lib/EndOfDayRequestManager.js");
var ExpressExternal = require("./lib/ExpressExternal.js");
var ExternalHttpServer = require("./lib/ExternalHttpServer.js");
var FrontendUpdater = require("./lib/FrontendUpdater.js");
var HeartbeatManager = require("./lib/HeartbeatManager.js");
var LastfmClient = require("./lib/LastfmClient.js");
var Logger = require("./lib/Logger.js");
var LoveManager = require("./lib/LoveManager.js");
var PermissionManager = require("./lib/PermissionManager.js");
var ScrobblingManager = require("./lib/ScrobblingManager.js");
var SkipManager = require("./lib/SkipManager.js");
var Socket = require("./lib/Socket.js");
var Spotify = require("./lib/Spotify.js");
var UserActivityFlagManager = require("./lib/UserActivityFlagManager.js");
var UserDao = require("./lib/UserDao.js");
var VotingManager = require("./lib/VotingManager.js");

// Instances
var config = require("./config.js");

// DI
var logger = new Logger(config);
var spotify = new Spotify(logger);
var dataStore = new DataStore(logger);
var lastfmClient = new LastfmClient(config, logger, dataStore);
var userDao = new UserDao(dataStore, lastfmClient, logger);
var socket = new Socket(userDao, logger);
var chat = new Chat(socket, config);
var heartbeatManager = new HeartbeatManager(socket, chat, userDao);
var votingManager = new VotingManager(chat, socket);
var permissionManager = new PermissionManager(socket, dataStore, userDao, votingManager, chat, logger);
var currentTrackManager = new CurrentTrackManager(socket, chat, logger);
var skipManager = new SkipManager(socket, chat);
var expressExternal = new ExpressExternal(config, lastfmClient, userDao, chat, permissionManager, logger);
var externalHttpServer = new ExternalHttpServer(expressExternal, socket, config, logger);

// Nothing depends on those:

new Backend(userDao, currentTrackManager, lastfmClient, spotify, skipManager, socket, chat, logger);
new FrontendUpdater(socket, userDao, currentTrackManager, skipManager);
new ScrobblingManager(socket, userDao);
new LoveManager(socket, currentTrackManager, chat, lastfmClient, logger);
new EndOfDayRequestManager(userDao, votingManager, socket);
new UserActivityFlagManager(userDao, chat, socket);

// Start
expressExternal.start();
externalHttpServer.start();
heartbeatManager.start();
