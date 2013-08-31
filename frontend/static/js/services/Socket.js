var Socket = function(SOCKJS_URL) {
	var that = this;
	this.openCallback = $.Callbacks();
	this.closeCallback = $.Callbacks();
	this.chatCallback = $.Callbacks();
	this.sysCallback = $.Callbacks();
	this.newTrackCallback = $.Callbacks();
	this.usersCallback = $.Callbacks();
	this.progressCallback = $.Callbacks();
	this.skippersCallback = $.Callbacks();

	var sockjs;
	var reconnectTimeout = null;

	function send(type, data) {
		var payload = {
			'type': type,
			'data': data
		};
		sockjs.send(JSON.stringify(payload));
	}

	that.sendChatMessage = function(message) {
		send('chatMessage', message);
	}

	that.sendSkip = function(message) {
		send('skip', {text: message});
	}

	that.sendRequest = function(request) {
		send('request', request);
	}

	that.sendScrobbleStatus = function(status) {
		send('scrobbleStatus', status);
	}

	that.love = function() {
		send('love', {});
	}

	that.unlove = function() {
		send('unlove', {});
	}

	function connect () {
		sockjs = new SockJS(SOCKJS_URL);
		
		sockjs.onmessage = function(payload) {
			payload = $.parseJSON(payload.data);
			var type = payload.type;
			var data = payload.data;

			if (type == 'disconnected') {
				location.href = '/logout';
				return;
			}

			if (type == 'newTrack') {
				
				that.newTrackCallback.fire(data);
				
				// We're getting empty new track events through occasionally
				// We don't need to 'chat' about these.
				if (! $.isEmptyObject(data)) {
					that.chatCallback.fire(data);
				}
				return;
			}

			if (type == 'users') {
				that.usersCallback.fire(data);
				return;
			}

			if (type == 'skippers') {
				that.skippersCallback.fire(data);
				return;
			}

			if (type == 'progress') {
				that.progressCallback.fire(data);
				return;
			}

			if (type == 'chat') {
				that.chatCallback.fire(data);
				return;
			}

			if (type == 'sys') {
				that.sysCallback.fire(data);
				return;
			}

			console.log('Unhandled Message: ', type, data);
		};

		var heartbeat = null;

		sockjs.onopen = function() {
			var session = $.cookie('session');
			if (session == undefined) {
				session = '';
			}
			sockjs.send(session);

			if (reconnectTimeout != null) {
				reconnectTimeout = null;
				clearTimeout(reconnectTimeout);
			}
			that.openCallback.fire();

			heartbeat = setInterval(function() {
				send('heartbeat', null);
			}, 2000);
		};
		sockjs.onclose = function() {
			that.closeCallback.fire();
			reconnectTimeout = setTimeout(connect, 1000);
			clearInterval(heartbeat);
		};
	};

	connect();
	
	
	
}