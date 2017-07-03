const YoutubeDL = require('/home/fergus/node_modules/youtube-dl');
const ytdl = require('/home/fergus/node_modules/ytdl-core');
const jsonfile = require('/home/fergus/node_modules/jsonfile');
const fs = require('fs');
const constants = require('./constants.js');

/**
 * Takes a discord.js client and turns it into a music bot.
 * Thanks to 'derekmartinez18' for helping.
 * Modified by pablofergus for personal use.
 * 
 * @param {Client} client - The discord.js client.
 * @param {object} options - (Optional) Options to configure the music bot. Acceptable options are:
 * 							prefix: The prefix to use for the commands (default '').
 * 							global: Whether to use a global queue instead of a server-specific queue (default false).
 * 							maxQueueSize: The maximum queue size (default 20).
 * 							anyoneCanSkip: Allow anybody to skip the song.
 * 							clearInvoker: Clear the command message.
 * 							volume: The default volume of the player.
 * 							volumePermission: Permission required to use some commands.
 * 							textChannel: Only the commands with this string in their names will recieve the commands.
 */
module.exports = function (client, options) {
	// Get all default options.
	let PREFIX = (options && options.prefix) || '';
	let GLOBAL = (options && options.global) || false;
	let MAX_QUEUE_SIZE = (options && options.maxQueueSize) || 20;
	let DEFAULT_VOLUME = (options && options.volume) || 50;
	let ALLOW_ALL_SKIP = (options && options.anyoneCanSkip) || false;
	let CLEAR_INVOKER = (options && options.clearInvoker) || false;
	let VOLUME_PERMISSION = (options && options.volumePermission) || 'ADMINISTRATOR';
	let TEXT_CHANNEL_FILTER = (options && options.textChannel) || 'music';
	let PLAYLIST_PERMISSION = 'MANAGE_MESSAGES';

	// Create an object of queues.
	let queues = {};

	// Catch message events.
	client.on('message', msg => {

		const message = msg.content.trim();

		const defaultConfFile = './config/default.json';
		const confFile = './config/' + msg.guild.id + '.json';
		//Load configuration from server json. If it doesn't exist, it uses default.json.
		fs.exists( confFile, (exists) => {
			if ( exists ) 
				return;
			else
				return confFile = defaultConfFile;
		});
		const config = jsonfile.readFileSync(confFile);

		PREFIX = config.general.prefix;
		MAX_QUEUE_SIZE = config.music.max_queue;
		DEFAULT_VOLUME = config.music.volume;
		CLEAR_INVOKER = config.music.clear_invoker;
		VOLUME_PERMISSION = config.permissions.music_permission.toUpperCase();
		TEXT_CHANNEL_FILTER = config.music.text_channel;
		PLAYLIST_PERMISSION = config.permissions.playlist_permission.toUpperCase();

		// Check if the message is a command.
		if (message.toLowerCase().startsWith(PREFIX.toLowerCase()) && msg.channel.name.includes(TEXT_CHANNEL_FILTER)) {
			// Get the command and suffix.
			const command = message.substring(PREFIX.length).split(/[ \n]/)[0].toLowerCase().trim();
			const suffix = message.substring(PREFIX.length + command.length).trim();

			// Process the commands.
			switch (command) {
				case 'play':
					return play(msg, suffix);
				case 'skip':
					return skip(msg, suffix);
				case 'queue':
					return queue(msg, suffix);
				case 'pause':
					return pause(msg, suffix);
				case 'resume':
					return resume(msg, suffix);
				case 'volume':
					return volume(msg, suffix);
				case 'repeat':
					return repeat(msg, suffix);
				case 'leave':
					return leave(msg, suffix);
				case 'clearqueue':
					return clearqueue(msg, suffix);
				case 'skipto':
					return skipto(msg, suffix);
				case 'playlist':
					return playlist(msg, suffix);
			}
			if (CLEAR_INVOKER) {
				msg.delete();
			}
		}
	});

	/**
	 * Checks if a user is an admin.
	 * 
	 * @param {GuildMember} member - The guild member
	 * @returns {boolean} - 
	 */
	function isAdmin(member) {
		return member.hasPermission(VOLUME_PERMISSION);
	}

	/**
	 * Checks if the user can skip the song.
	 * 
	 * @param {GuildMember} member - The guild member
	 * @param {array} queue - The current queue
	 * @returns {boolean} - If the user can skip
	 */
	function canSkip(member, queue) {
		if (ALLOW_ALL_SKIP) return true;
		else if (queue[0].requester === member.id) return true;
		else if (isAdmin(member)) return true;
		else return false;
	}

	function canPlaylist(member) {
		return member.hasPermission(PLAYLIST_PERMISSION);
	}

	/**
	 * Gets the song queue of the server.
	 * 
	 * @param {integer} server - The server id. 
	 * @returns {object} - The song queue.
	 */
	function getQueue(server) {
		// Check if global queues are enabled.
		if (GLOBAL) server = '_'; // Change to global queue.

		// Return the queue.
		if (!queues[server]) queues[server] = [];
		return queues[server];
	}

	/**
	 * The command for adding a song to the queue.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 * @returns {<promise>} - The response edit.
	 */
	function play(msg, suffix) {
		// Make sure the user is in a voice channel.
		if (msg.member.voiceChannel === undefined) return msg.channel.send(wrap('You\'re not in a voice channel.'));

		// Make sure the suffix exists.
		if (!suffix) return msg.channel.send(wrap('No video specified!'));

		// Get the queue.
		const queue = getQueue(msg.guild.id);

		// Check if the queue has reached its maximum size.
		if (queue.length >= MAX_QUEUE_SIZE) {
			return msg.channel.send(wrap('Maximum queue size reached!'));
		}

		// Get the video information.
		msg.channel.send(wrap('Searching...')).then(response => {
			var searchstring = suffix
			if (!suffix.toLowerCase().startsWith('http')) {
				searchstring = 'gvsearch1:' + suffix;
			}

			YoutubeDL.getInfo(searchstring, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
				// Verify the info.
				if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
					return response.edit(wrap('Invalid video!'));
				}

				info.requester = msg.author.id;

				// Queue the video.
				response.edit(wrap('Queued: ' + info.title)).then(() => {
					queue.push(info);
					// Play if only one element in the queue.
					if (queue.length === 1) executeQueue(msg, queue);
				}).catch(console.log);
			});
		}).catch(console.log);
	}


	/**
	 * The command for skipping a song.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 * @returns {<promise>} - The response message.
	 */
	function skip(msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
		if (voiceConnection === null) return msg.channel.send(wrap('No music being played.'));

		// Get the queue.
		const queue = getQueue(msg.guild.id);

		if (!canSkip(msg.member, queue)) return msg.channel.send(wrap('You cannot skip this as you didn\'t queue it.')).then((response) => {
			response.delete(5000);
		});

		// Get the number to skip.
		let toSkip = 1; // Default 1.
		if (!isNaN(suffix) && parseInt(suffix) > 0) {
			toSkip = parseInt(suffix);
		}
		toSkip = Math.min(toSkip, queue.length);

		// Skip.
		queue.splice(0, toSkip - 1);

		// Resume and stop playing.
		const dispatcher = voiceConnection.player.dispatcher;
		if ( typeof dispatcher === "undefined" )
			return msg.channel.send( wrap('You must wait a moment before using this command again!') );
		if (voiceConnection.paused) dispatcher.resume();
		dispatcher.end();

		msg.channel.send(wrap('Skipped ' + toSkip + '!'));
	}

	/**
	 * The command for listing the queue.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 */
	function queue(msg, suffix) {
		// Get the queue.
		const queue = getQueue(msg.guild.id);

		// Get the queue text.
		const text = queue.map((video, index) => (
			(index + 1) + ': ' + video.title
		)).join('\n');

		// Get the status of the queue.
		let queueStatus = 'Stopped';
		const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
		if (voiceConnection !== null) {
			const dispatcher = voiceConnection.player.dispatcher;
			queueStatus = dispatcher.paused ? 'Paused' : 'Playing';
		}

		// Send the queue and status.
		msg.channel.send(wrap('Queue (' + queueStatus + '):\n' + text));
	}

	/**
	 * The command for pausing the current song.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 * @returns {<promise>} - The response message.
	 */
	function pause(msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
		if (voiceConnection === null) return msg.channel.send(wrap('No music being played.'));

		if (!isAdmin(msg.member))
			return msg.channel.send(wrap('You are not authorized to use this.'));

		// Pause.
		msg.channel.send(wrap('Playback paused.'));
		const dispatcher = voiceConnection.player.dispatcher;
		if (!dispatcher.paused) dispatcher.pause();
	}

	/**
	 * The command for leaving the channel and clearing the queue.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 * @returns {<promise>} - The response message.
	 */
	function leave(msg, suffix) {
		if (isAdmin(msg.member)) {
			const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
			if (voiceConnection === null) return msg.channel.send(wrap('I\'m not in any channel!.'));
			// Clear the queue.
			const queue = getQueue(msg.guild.id);
			queue.splice(0, queue.length);

			// End the stream and disconnect.
			voiceConnection.player.dispatcher.end();
			voiceConnection.disconnect();
		} else {
			msg.channel.send(wrap('You don\'t have permission to use that command!'));
		}
	}

	/**
	 * The command for clearing the song queue.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 */
	function clearqueue(msg, suffix) {
		if (isAdmin(msg.member)) {
			const num = parseInt( suffix );
			const queue = getQueue(msg.guild.id);
			
			if ( suffix.length == 0 ){
				queue.splice(0, queue.length);
				msg.channel.send(wrap('Queue cleared!'));
			} else if ( !isNaN(num) && num <= queue.length ) {
				queue.splice(num - 1, 1);
				msg.channel.send(wrap('Removed the number ' + num + ' position in the queue!'));
			} else {
				msg.channel.send(wraap('That position doesnt exist!'));
			}
		} else {
			msg.channel.send(wrap('You don\'t have permission to use that command!'));
		}
	}

	/**
	 * The command for resuming the current song.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 * @returns {<promise>} - The response message.
	 */
	function resume(msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
		if (voiceConnection === null) return msg.channel.send(wrap('No music being played.'));

		if (!isAdmin(msg.member))
			return msg.channel.send(wrap('You are not authorized to use this.'));

		// Resume.
		msg.channel.send(wrap('Playback resumed.'));
		const dispatcher = voiceConnection.player.dispatcher;
		if (dispatcher.paused) dispatcher.resume();
	}

	/**
	 * The command for changing the song volume.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {string} suffix - Command suffix.
	 * @returns {<promise>} - The response message.
	 */
	function volume(msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
		if (voiceConnection === null) return msg.channel.send(wrap('No music being played.'));

		if (!isAdmin(msg.member))
			return msg.channel.send(wrap('You are not authorized to use this.'));

		// Get the dispatcher
		const dispatcher = voiceConnection.player.dispatcher;

		if (suffix > 200 || suffix < 0) return msg.channel.send(wrap('Volume out of range!')).then((response) => {
			response.delete(5000);
		});

		msg.channel.send(wrap("Volume set to " + suffix));
		dispatcher.setVolume((suffix/100));
	}

	/**
	 * Repeats current song indefenitely.
	 * @param  {Message} msg    Discord message.
	 * @param  {String} suffix Command parameters.
	 */
	function repeat(msg, suffix) {
		if ( !isAdmin(msg.member) )
			return msg.channel.send(wrap('You do not have permission to do that!'));
		const defaultConfFile = constants.defaultConfigFile;
		const confFile = './config/' + msg.guild.id + '.json';
		//Load configuration from server json. If it doesn't exist, it uses default.json.
		fs.exists( confFile, (exists) => {
			if ( exists ) 
				return;
			else
				return confFile = defaultConfFile;
		});
		if ( confFile === defaultConfFile )
			return msg.channel.send(wrap('No config file, this is a big problem, contact the bot developer.'));
		else
		var config = jsonfile.readFileSync(confFile);
		config.music.repeat = !config.music.repeat;
		jsonfile.writeFile(confFile, config, {spaces: 2}, function (err) {
			console.error(err);
		});

		return msg.channel.send(wrap(config.music.repeat ? 'Repeat mode is activated.' : 'Repeat mode is deactivated.'));
	}

	/**
	 * Executes the next song in the queue.
	 * 
	 * @param {Message} msg - Original message.
	 * @param {object} queue - The song queue for this server.
	 * @returns {<promise>} - The voice channel.
	 */
	function executeQueue(msg, queue) {
		// If the queue is empty, finish.
		if (queue.length === 0) {
			msg.channel.send(wrap('Playback finished.'));

			// Leave the voice channel.
			const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
			if (voiceConnection !== null) return voiceConnection.disconnect();
		}


		
		new Promise((resolve, reject) => {
			// Join the voice channel if not already in one.
			const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
			if (voiceConnection === null) {
				// Check if the user is in a voice channel.
				if (msg.member.voiceChannel) {
					msg.member.voiceChannel.join().then(connection => {
						resolve(connection);
					}).catch((error) => {
						console.log(error);
					});
				} else {
					// Otherwise, clear the queue and do nothing.
					queue.splice(0, queue.length);
					reject();
				}
			} else {
				resolve(voiceConnection);
			}
		}).then(connection => {
			// Get the first item in the queue.
			const video = queue[0];

			console.log(video.webpage_url);

			// Play the video.
			msg.channel.send(wrap('Now Playing: ' + video.title + ' (' + video.duration + ')') + ' ( ' + video.webpage_url + ' )').then(() => {
				//ytdlStream = ytdl(video.webpage_url, {filter: 'audioonly'});
				let dispatcher = connection.playStream( ytdl(video.webpage_url, {filter: 'audioonly'}), {seek: 0, volume: (DEFAULT_VOLUME/100)});
				
				connection.on('error', (error) => {
					// Skip to the next song.
					console.log(error);
					queue.shift();
					executeQueue(msg, queue);
				});

				dispatcher.on('error', (error) => {
					// Skip to the next song.
					console.log(error);
					queue.shift();
					executeQueue(msg, queue);
				});

				dispatcher.on('end', (reason) => {
					console.log(reason);
					// Wait a second. 
					const defaultConfFile = './config/default.json';
					const confFile = './config/' + msg.guild.id + '.json';
					//Load configuration from server json. If it doesn't exist, it uses default.json.
					fs.exists( confFile, (exists) => {
						if ( exists ) 
							return;
						else
							return confFile = defaultConfFile;
					});
					const config = jsonfile.readFileSync(confFile);
					const SONG_REPEAT = config.music.repeat;
					setTimeout(() => {
						if (queue.length > 0 && reason !== 'skipto' ) {
							if ( !SONG_REPEAT )
								// Remove the song from the queue.
								queue.shift();
							// Play the next song in the queue.
							executeQueue(msg, queue);
						}
					}, 1000);
				});
			}).catch((error) => {
				console.log(error);
			});
		}).catch((error) => {
			console.log(error);
		});
	}

	/**
	 * Skip to a certain time in the video.
	 * @param  {String} msg    Command
	 * @param  {String} suffix Number of seconds to skip.
	 */
	function skipto(msg, suffix) {
		// If the queue is empty, finish.
		const queue = getQueue(msg.guild.id);
		if (queue.length === 0) {
			return msg.channel.send(wrap('No songs in queue.'));
		}

		const num = suffix;
		if ( suffix.length == 0 )
			return msg.channel.send(wrap('No time specified!'));
		else if ( !isNaN(num) && num < toSeconds(queue[0].duration) && num >= 0 ) {
			console.log( toSeconds(queue[0].duration) + '   ' + queue[0].duration);
			const time = num;
		} else {
			console.log(toSeconds(queue[0].duration) + '   ' + queue[0].duration);
			return msg.channel.send(wrap('That time doesnt exist!'));
		}
		const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
		const dispatcher = voiceConnection.player.dispatcher;

		dispatcher.end('skipto');



		new Promise((resolve, reject) => {
			if (voiceConnection === null) {
				// Check if the user is in a voice channel.
				msg.channel.send(wrap('No song playing!'));
				reject();
			} else {
				resolve(voiceConnection);
			}
		}).then(connection => {
			// Get the first item in the queue.
			const video = queue[0];

			// Play the video.
			msg.channel.send(wrap('Skipped to second ' + num)).then(() => {
/*				if ( typeof ytdlStream === "undefined" )
					return msg.channel.send(wrap('Terrible error, plz to help'));*/

				let dispatcher = connection.playStream( ytdl(video.webpage_url, {filter: 'audioonly'}), {seek: num, volume: (DEFAULT_VOLUME/100)});

				connection.on('error', (error) => {
					// Skip to the next song.
					console.log(error);
					queue.shift();
					executeQueue(msg, queue);
				});

				dispatcher.on('error', (error) => {
					// Skip to the next song.
					console.log(error);
					queue.shift();
					executeQueue(msg, queue);
				});

				dispatcher.on('end', (reason) => {
					console.log(reason);
					// Wait a second.
					const defaultConfFile = './config/default.json';
					const confFile = './config/' + msg.guild.id + '.json';
					//Load configuration from server json. If it doesn't exist, it uses default.json.
					fs.exists( confFile, (exists) => {
						if ( exists ) 
							return;
						else
							return confFile = defaultConfFile;
					});
					const config = jsonfile.readFileSync(confFile);
					const SONG_REPEAT = config.music.repeat;
					setTimeout(() => {
						if (queue.length > 0 && reason !== 'skipto') {
							if ( SONG_REPEAT )
								// Remove the song from the queue.
								queue.shift();
							// Play the next song in the queue.
							executeQueue(msg, queue);
						}
					}, 1000);
				});
			}).catch((error) => {
				console.log(error);
			});
		}).catch((error) => {
			console.log(error);
		});
	}

	/**
	 * Playlist command processing.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The rest of the command, after "playlist".
	 */
	function playlist ( msg, suffix ) { 
		if ( !canPlaylist(msg.member) )
			return msg.reply(wrap('You do not have permision to do that!'));
		if (!fs.existsSync( './playlists/' + msg.guild.id ))
			fs.mkdirSync( './playlists/' + msg.guild.id );

		const command = suffix.split(" ")[0].trim();
		const value = suffix.split(" ").length === 1 ? null : suffix.substring(command.length).trim();

		switch (command) {
			case 'new':
				return playlistNew( msg, value );
			case 'load':
				return playlistLoad( msg, value );
			case 'delete':
				return playlistDelete( msg, value );
			case 'list':
				return playlistList( msg, value );
			case 'info':
				return playlistInfo( msg, value );
			case 'edit':
				return playlistEdit( msg, value );
			default:
				return msg.channel.send(wrap('That playlist command does not exist!'));
		}
	}

	/**
	 * Creates a new playlist and saves it as a json file.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The rest of the command, after "playlist".
	 */
	function playlistNew ( msg, value ) {
		if ( value === null )
			return msg.channel.send(wrap('No playlist specified!'));
		const queue = getQueue(msg.guild.id);
		var content = {};
		content.info = {};
		content.queue = queue;
		content.info.name = value;
		content.info.length = queue.length;
		const date = new Date();
		content.info.date = date.toUTCString();

		const dir = './playlists/' + msg.guild.id + '/' + value.replace(/[^A-Z0-9]+/ig, "_") + '.json';
		var exists = !fs.existsSync( dir );

		fs.writeFile( dir, '' , function(err) {
			if ( err )
				return console.log(err);
			jsonfile.writeFile( dir, content, {spaces: 2}, function (err) {
				if (err)
					return console.error(err);
				if ( exists )
					msg.channel.send( wrap( "New playlist saved, named " + value ));
				else
					msg.channel.send(wrap("Playlist modified."));
			});
		});
	}

	/**
	 * Loads one of the saved playlists.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The rest of the command, after "playlist".
	 */
	function playlistLoad ( msg, value ) {
		if (msg.member.voiceChannel === undefined) return msg.channel.send(wrap('You\'re not in a voice channel.'));
		if ( value === null )
			return msg.channel.send(wrap('No playlist specified!'));
		const dir = './playlists/' + msg.guild.id + '/' + value.replace(/[^A-Z0-9]+/ig, "_") + '.json';
		if ( !fs.existsSync( dir ) )
			return msg.channel.send(wrap('That playlist doesnt exist!'));
		const content = jsonfile.readFileSync(dir);
		const contentQueue = content.queue;
		const queue = getQueue(msg.guild.id);

		var noSongs = false;
		if ( queue.length == 0 ) 
			noSongs = true;
		contentQueue.forEach( function (video) {
			queue.push(video);
		});
		if ( noSongs )
			executeQueue(msg, queue);
		msg.channel.send(wrap('Playlist: ' + content.info.name + '\n' + content.info.length + ' songs, created on ' + content.info.date));
	}

	/**
	 * Deletes one of the saved playlists.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The rest of the command, after "playlist".
	 */
	function playlistDelete( msg, value ) {
		if ( value === null )
			return msg.channel.send(wrap('No playlist specified!'));
		const dir = './playlists/' + msg.guild.id + '/' + value.replace(/[^A-Z0-9]+/ig, "_") + '.json';
		if ( !fs.existsSync( dir ) )
			return msg.channel.send(wrap('That playlist doesnt exist!'));
		fs.unlink(dir, (err) => {
			if (err)
				return console.log(err);;
			msg.channel.send(wrap('Playlist succesfully deleted.'));
		});
	}

	/**
	 * Lists the playlists saved on the server.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The rest of the command, after "playlist".
	 */
	function playlistList ( msg, value ) {
		fs.readdir('./playlists/' + msg.guild.id, (err, files) => {
			if (err)
				return console.log(err);
			var playlists = [];
			files.forEach(function (file) {
				playlists.push(jsonfile.readFileSync('./playlists/' + msg.guild.id + '/' + file));
			});
			var str = 'List of playlists on this server:';
			playlists.forEach( function ( pl ) {
				str += '\n\t' + pl.info.name + ': ' + pl.info.length + ' songs, created on ' + pl.info.date ;
			});
			msg.channel.send(wrap(str));
		});

	}

	/**
	 * Lists info of the specified playlist.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The rest of the command, after "playlist".
	 */
	function playlistInfo( msg, value ) {
		if ( value === null )
			return msg.channel.send(wrap('No playlist specified!'));
		const dir = './playlists/' + msg.guild.id + '/' + value.replace(/[^A-Z0-9]+/ig, "_") + '.json';
		if ( !fs.existsSync( dir ) )
			return msg.channel.send(wrap('That playlist doesnt exist!'));
		const content = jsonfile.readFileSync(dir);
		var str = 'Playlist: ' + content.info.name + '\n' + content.info.length + ' songs, created on ' + content.info.date;
		var queue = content.queue;
		for ( var i = 0; i < queue.length; i++ )
			str += '\n\t' + (i+1) + ': ' + queue[i].title + ' (' + queue[i].duration + ').';
		msg.channel.send(wrap(str));
	}

	/**
	 * Processes the playlist editing commands.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The rest of the command, after "edit".
	 */
	function playlistEdit( msg, value ) {
		const command = value.split(" ")[0].trim();
		const suffix = value.split(" ").length === 1 ? null : value.substring(command.length).trim();
		if ( command === '' )
			return msg.channel.send( wrap('You must enter an editing command!') );

		if( suffix === null )
			return msg.channel.send( wrap ('You must enter the command parameters!') );

		switch (command){
			case 'add':
				return playlistEditAdd( msg, suffix );
			case 'replace':
				return playlistEditReplace( msg, suffix );
			case 'remove':
				return playlistEditRemove( msg, suffix );
			default:
				return msg.channel.send(wrap('That edit command does not exist!'));
		}
	}

	/**
	 * Adds a song into a specified position in an existing playlist.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The parameters of the "edit add" command.
	 */
	function playlistEditAdd( msg, suffix ){
		if ( !suffix.split("#").length >= 2 )
			return msg.channel.send( wrap('You must enter a song name after #!') );
		if ( !suffix.split("#").length === 3 )
			return msg.channel.send( wrap('You must enter a song number after #!') );

		const playlistName = suffix.split("#")[0].trim();
		if ( playlistName === '' )
			return msg.channel.send( wrap('You must enter a playlist name!') );

		const songName = suffix.split("#")[1].trim();
		if ( songName === '' )
			return msg.channel.send( wrap('You must enter a song name!') );

		const songNumber = suffix.split("#")[2].trim();
		if ( songNumber === '' || isNaN(songNumber) )
			return msg.channel.send( wrap('You must enter a song number!') );

		if ( playlistName === null )
			return msg.channel.send(wrap('No playlist specified!'));
		const dir = './playlists/' + msg.guild.id + '/' + playlistName.replace(/[^A-Z0-9]+/ig, "_") + '.json';
		const exists = !fs.existsSync( dir );
		if ( exists )
			return msg.channel.send(wrap('That playlist doesnt exist!'));
		var playlist = jsonfile.readFileSync(dir);

		if ( playlist.queue.length < songNumber || songNumber <= 0 )
			return msg.channel.send( wrap('That song number is not in the playlist!'));

		// Get the video information.
		msg.channel.send(wrap('Searching...')).then(response => {
			var searchstring = suffix
			if (!suffix.toLowerCase().startsWith('http')) {
				searchstring = 'gvsearch1:' + suffix;
			}

			YoutubeDL.getInfo(searchstring, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
				// Verify the info.
				if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
					return response.edit(wrap('Invalid video!'));
				}

				info.requester = msg.author.id;

				// Add the video.
				response.edit(wrap('Added: ' + info.title)).then(() => {
					playlist.queue.splice( Number(songNumber) - 1, 0, info );
					jsonfile.writeFile( dir, playlist, {spaces: 2}, function (err) {
						if (err)
							return console.error(err);
					});
				}).catch(console.log);
			});
		}).catch(console.log);

	}

	/**
	 * Replaces a song in an existing playlist for a new one.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The parameters of the "edit replace" command.
	 */
	function playlistEditReplace( msg, suffix ){
		if ( !suffix.split("#").length >= 2 )
			return msg.channel.send( wrap('You must enter a song name after #!') );
		if ( !suffix.split("#").length === 3 )
			return msg.channel.send( wrap('You must enter a song number after #!') );

		const playlistName = suffix.split("#")[0].trim();
		if ( playlistName === '' )
			return msg.channel.send( wrap('You must enter a playlist name!') );

		const songName = suffix.split("#")[1].trim();
		if ( songName === '' )
			return msg.channel.send( wrap('You must enter a song name!') );

		const songNumber = suffix.split("#")[2].trim();
		if ( songNumber === '' || isNaN(songNumber) )
			return msg.channel.send( wrap('You must enter a song number!') );

		if ( playlistName === null )
			return msg.channel.send(wrap('No playlist specified!'));
		const dir = './playlists/' + msg.guild.id + '/' + playlistName.replace(/[^A-Z0-9]+/ig, "_") + '.json';
		const exists = !fs.existsSync( dir );
		if ( exists )
			return msg.channel.send(wrap('That playlist doesnt exist!'));
		var playlist = jsonfile.readFileSync(dir);

		if ( playlist.queue.length < songNumber || songNumber <= 0 )
			return msg.channel.send( wrap('That song number is not in the playlist!'));

		// Get the video information.
		msg.channel.send(wrap('Searching...')).then(response => {
			var searchstring = suffix
			if (!suffix.toLowerCase().startsWith('http')) {
				searchstring = 'gvsearch1:' + suffix;
			}

			YoutubeDL.getInfo(searchstring, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
				// Verify the info.
				if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
					return response.edit(wrap('Invalid video!'));
				}

				info.requester = msg.author.id;

				// Add the video.
				response.edit(wrap('Added: ' + info.title)).then(() => {
					playlist.queue[Number( songNumber) - 1 ] = info;
					jsonfile.writeFile( dir, playlist, {spaces: 2}, function (err) {
						if (err)
							return console.error(err);
					});
				}).catch(console.log);
			});
		}).catch(console.log);
	}

	/**
	 * Removes a song from an existing playlist.
	 * @param  {Message} msg    Discord's message.
	 * @param  {String} suffix The parameters of the "edit remove" command.
	 */
	function playlistEditRemove( msg, suffix ){
		if ( !suffix.split("#").length === 2 )
			return msg.channel.send( wrap('You must enter a song number after #!') );

		const playlistName = suffix.split("#")[0].trim();
		if ( playlistName === '' )
			return msg.channel.send( wrap('You must enter a playlist name!') );

		const songNumber = suffix.split("#")[1].trim();
		if ( songNumber === '' || isNaN(songNumber) )
			return msg.channel.send( wrap('You must enter a song number!') );

		if ( playlistName === null )
			return msg.channel.send(wrap('No playlist specified!'));
		const dir = './playlists/' + msg.guild.id + '/' + playlistName.replace(/[^A-Z0-9]+/ig, "_") + '.json';
		const exists = !fs.existsSync( dir );
		if ( exists )
			return msg.channel.send(wrap('That playlist doesnt exist!'));
		var playlist = jsonfile.readFileSync(dir);

		if ( playlist.queue.length < songNumber || songNumber <= 0 )
			return msg.channel.send( wrap('That song number is not in the playlist!'));
		msg.channel.send(wrap('Searching...')).then(() => {
			playlist.queue.splice( Number(songNumber) - 1 , 1 );
			jsonfile.writeFile( dir, playlist, {spaces: 2}, function (err) {
				if (err)
					return console.error(err);
			});
		});
	}
}



/**
 * Converts HH:MM:SS to seconds.
 * @param  {String} duration Must be formated as HH:MM:SS.
 * @return {Number}          Time in seconds.
 */
function toSeconds( duration ){
	var hours = duration.split(':').length === 3 ? parseInt( duration.split(':')['0'] ) : 0;
	var minutes = duration.split(':').length > 1 ? parseInt( duration.split(':')[ duration.split(':').length - 2 ] ) : 0;
	var seconds = parseInt( duration.split(':')[ duration.split(':').length - 1 ] );
	if ( isNaN(hours) || isNaN(minutes) || isNaN(seconds) )
		return console.log('Incorrect string format for toSeconds.');
	return (hours * 3600) + (minutes * 60) + (seconds);
}




/**
 * Wrap text in a code block and escape grave characters.
 * 
 * @param {string} text - The input text.
 * @returns {string} - The wrapped text.
 */
function wrap(text) {
	return '```\n' + text.replace(/`/g, '`' + String.fromCharCode(8203)) + '\n```';
}
