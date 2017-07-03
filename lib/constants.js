exports.permissions = ["ADMINISTRATOR",
					"CREATE_INSTANT_INVITE",
					"KICK_MEMBERS",
					"BAN_MEMBERS",
					"MANAGE_CHANNELS",
					"MANAGE_GUILD",
					"ADD_REACTIONS",
					"VIEW_AUDIT_LOG",
					"READ_MESSAGES",
					"SEND_MESSAGES",
					"SEND_TTS_MESSAGES",
					"MANAGE_MESSAGES",
					"EMBED_LINKS",
					"ATTACH_FILES",
					"READ_MESSAGE_HISTORY",
					"MENTION_EVERYONE",
					"USE_EXTERNAL_EMOJIS",
					"CONNECT",
					"SPEAK",
					"MUTE_MEMBERS",
					"DEAFEN_MEMBERS",
					"MOVE_MEMBERS",
					"USE_VAD",
					"CHANGE_NICKNAME",
					"MANAGE_ROLES",
					"MANAGE_ROLES_OR_PERMISSIONS",
					"MANAGE_WEBHOOKS",
					"MANAGE_EMOJIS"
					];

exports.defaultConfigFile = './config/default.json';

exports.help = 'Available commands:\n\tping - Replies with pong xdD.\n\twhat is my avatar - Replies with a link to your avatar.\n\theal me - Dank meme.\n\timg [search terms] (searchNumber) - Searchs google for an image, and replies with the link. If you add a number between 1 and 10 in parenthesis at the end, it will give you different results. Safe search is disabled.\n\tpurge [number] - If you have enough permissions, it deletes several messages in the channel, including the command.';

exports.musicHelp = 'Here are the aveilable commands: \n\tplay <url|search> - Play a video/music. It can take a URL from various services (YouTube, Vimeo, YouKu, etc). If no URL is specified, the bot will search Google for the video.\n\tskip [number] - Skip some number of songs. Will skip 1 song if a number is not specified.\n\tqueue - Display the current queue.\n\tclearqueue [number] - Clears the queue, or a specified position in the queue.\n\tpause - Pause music playback.\n\tresume - Resume music playback.\n\trepeat - Repeats the current, or the song you play, untill you deactivate it.\n\nPlaylists:\n\tplaylist new <name> - Saves the currennt queue into a playlist you can load afterwards. It can also overrite existing playlists if you wish to edit them.\n\tplaylist load <name> - Loads the playlist with the name specified.\n\tplaylist list - Lists the playlists currently saved on the server.\n\tplaylist info <name> - Lists the songs and some info of the specified playlist.\n\tplaylist delete <name> - Deletes de specified playlist.\n\tplaylist edit help - Shows the playlist editting commands.';

exports.playlistEditHelp = 'Here are the aveilable commands: \n\tplaylist edit add <playlist name> # <url|search> # <song number> - Adds a song to the specified position in an existing playlist.\n\tplaylist edit replace <playlist name> # <url|search> # <song number> - Replaces a song in an existing playlist by a new one.\n\tplaylist edit remove <playlist name> # <song number> - Removes the song in the specified position from an existing playlist.\n\nNotes: to find the song numbers of the playlists, you can use the "playlist info <name>" command. If you want to add a song to the end of a playlist, you can also load the playlist, add a new song to the queue, and then use "playlist new <name>" to replace the existing playlist.';

exports.adminHelp = 'DEFAULT SETTINGS:\n\nGENERAL:\n\tprefix - Prefix for the commands, for example ! or ?. Disabled by default.\n\tpurge_message - Writes a message with the number of messages deleted when you use purge. Must be true/false.\nPERMISSIONS:\n\tmusic_permission - Permission to use various music commands, like leave, clearqueue, or override skip. Default is ADMINISTRATOR.\n\tpurge_permission - Permission to use the purge command. Default is MANAGE_MESSAGES.\nMUSIC:\n\tvolume - From 0 to 200. Default is 50.\n\ttext_channel - Filters using text channel name for the music commands. Default is "music".\n\tclear_invoker - Deletes de music command message after the command is executed. Default is false (must be true/false).\n\tmax_queue - Max videos that can be in the queue at once. Default is 20.\n\nCHANGING SETTINGS:\nTo change the settings you must use the following command: _settings category:property=value, where category is one of general, permissions, or music, property is one of the settings in the category, and value, the new value the setting wil take. Permission settings must be one of the flags from the list you can get with the command "permissions help".\nTo view the current settings, use "currentsettings".';

exports.permissionError = 'You dont have premission to do that!';