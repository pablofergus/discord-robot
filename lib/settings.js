const Discord = require('/home/fergus/node_modules/discord.js');
const jsonfile = require('/home/fergus/node_modules/jsonfile');
const fs = require('fs');
const constants = require('./constants.js');

const permissions = constants.permissions;

/**
 * This module changes settings for each guild in their .json file.
 * @author Pablo Fergus
 * @param  {Client} client Bot client.
 */
module.exports = function( client ) {
	client.on('message', msg => {

		if(msg.author.bot) return;
		const message = msg.content.trim();

		// Get the command and suffix.
		const command = message.split(/[ \n]/)[0].toLowerCase().trim();
		const suffix = message.substring(command.length).toLowerCase().trim();

		// Process the commands.
		if ( command === '_settings' ){
			if ( msg.member.hasPermission("MANAGE_ROLES") )
				settings( msg, suffix );
			else
				msg.reply(wrap('You dont have permission to do that!'));
		}

	});
}

/**
 * Changes the settings. Syntax of command: _settings category:property=value.
 * @param  {Message} msg    Message sent, used for replying.
 * @param  {String} suffix Command parameters.
 */
function settings ( msg, suffix ) {

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

	const suffixValue = suffix.split("=").length === 2 ? suffix.split("=")[1].trim() : null;
	console.log("value " + suffixValue);
	const suffixCategory = suffix.split(":").length === 2 ? suffix.split(":")[0].trim() : null;

	if ( suffixValue === null || suffixCategory === null || suffixValue === suffix || suffixCategory === suffix )
		return msg.channel.send(wrap('Incorrect syntax.'));

	const suffixProperty = suffix.split(":")[1].split("=")[0].trim();

	if ( typeof config[suffixCategory] === "undefined" )
		return msg.channel.send(wrap('That category does not exist!'));

	if ( typeof config[suffixCategory][suffixProperty] === "undefined" )
		return msg.channel.send(wrap('That property does not exist!'));

	if ( suffixProperty.includes('permission') && permissions.indexOf(suffixValue.toUpperCase()) === -1 )
		return msg.channel.send(wrap('The permission "' + suffixValue.toUpperCase() + '" does not exist!"'));

	if ( suffixProperty === 'volume' && (suffixValue > 200 || suffixValue < 0 ) )
		return msg.channel.send(wrap('Volume must be between 0 and 200!'));

	if ( (suffixProperty === 'clear_invoker' || suffixProperty === 'purge_message') && (suffixValue !== 'true' && suffixValue !== 'false') )
		return msg.channel.send(wrap('That value must be true or false!'));

	if ( suffixProperty === 'max_queue' && isNaN(suffixValue) )
		return msg.channel.send(wrap('Max queue must be a number!'));

	if ( suffixProperty === 'volume' || suffixProperty === 'max_queue' )
		config[suffixCategory][suffixProperty] = parseInt(suffixValue);
	else if ( suffixProperty === 'clear_invoker' || suffixProperty === 'purge_message' )
		config[suffixCategory][suffixProperty] = (suffixValue == 'true');
	else
		config[suffixCategory][suffixProperty] = suffixValue;

	jsonfile.writeFile(confFile, config, {spaces: 2}, function (err) {
			console.error(err);
		});
	
	msg.channel.send(wrap('Settings changed succesfully!'));
}


function constructJson ( suffixCategory, suffixProperty, suffixValue ) {
	return '{"' + suffixCategory + '":{"' + suffixProperty + '": ' + suffixValue + '}}';
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