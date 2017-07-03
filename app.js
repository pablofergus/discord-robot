const Discord = require('/home/fergus/node_modules/discord.js');
const client = new Discord.Client();
const music = require('./lib/music.js');
const jsonfile = require('/home/fergus/node_modules/jsonfile');
const fs = require('fs');

const messageProcessing = require('./lib/message-processing.js');
const settings = require('./lib/settings.js');
const constants = require('./lib/constants.js');

var confFile = constants.defaultConfigFile;
const config = jsonfile.readFileSync(confFile);


/**
 * Startup sequence.
 */
client.on( 'ready', () => {
	console.log('I am ready! ' + new Date() );
	//client.guilds.first().defaultChannel.send('jejjej');
});

/**
 * Processing incomming text channel messages.
 * @param  {Message} message Message recieved
 */
client.on( 'message', message => {
	messageProcessing(message, client);
});

/**
 * User joins server event.
 * @param  {GuildMember} member Added member.
 */
client.on('guildMemberAdd', member => {
	member.guild.defaultChannel.send( wrap( member.user.username + ' se ha unido al servidor.' ) );
});

/**
 * User leaves server event.
 * @param  {GuildMember} member Added member.
 */
client.on('guildMemberRemove', member => {
	member.guild.defaultChannel.send( wrap( member.user.username + ' ha salido del servidor.' ) );
});

/**
 * When bot is added to a server, creates new config file with default settings
 * @param  {Guild} guild Guild to which the bot is added. 
 */
client.on('guildCreate', guild => {
	fs.writeFile( './config/' + guild.id + '.json', '' , function(err) {
		if ( err )
			return console.log(err);
		console.log( "New config file for guild " + guild.id );
	});
	fs.createReadStream('./config/default.json').pipe(fs.createWriteStream('./config/' + guild.id + '.json'));

	if (!fs.existsSync( './playlists/' + guild.id ))
		fs.mkdirSync( './playlists/' + guild.id );
});

/**
 * discord.js-music-v11
 */
music(client, {
	prefix: config.general.prefix,	// Prefix of '-'.
	maxQueueSize: config.music.max_queue,	// Maximum queue size of 10.
	clearInvoker: config.music.clear_invoker,	// If permissions applicable, allow the bot to delete the messages that invoke it (start with prefix)
	volume: config.music.volume,	// Music volume
	volumePermission: config.permissions.music_permission.toUpperCase(),	// Permission required to use volume command.
	textChannel: config.music.text_channel	// Text channel name filter for music commands.
});


settings( client );

/**
 * Wrap text in a code block and escape grave characters.
 * 
 * @param {string} text - The input text.
 * @returns {string} - The wrapped text.
 */
function wrap(text) {
	return '```\n' + text.replace(/`/g, '`' + String.fromCharCode(8203)) + '\n```';
}

client.login('MjMyMjM3OTYzNzkzMjY4NzM4.DB2_1Q.hqee65gr6fmnUCIvl_PZmgVMGM0');
