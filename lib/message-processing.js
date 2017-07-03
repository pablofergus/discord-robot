const jsonfile = require('/home/fergus/node_modules/jsonfile');
const fs = require('fs');
const GoogleImages = require('/home/fergus/node_modules/google-images');
const constants = require('./constants.js');
const cat = require('./cat.js');
const gm = require('gm');

const imageClient = new GoogleImages( '008396739198280254028:eyftbxk9cn0', 'AIzaSyAyWd7z5g0QEpz5DxK2pIeDPICMIDUSenQ' );

const permissions = constants.permissions;

/**
 * Proccess incomming text messages on all channels.
 * @param  {Message} message Recieved message.
 */
module.exports = function ( message, client ) {

	if(message.author.bot) return;

	console.log( message.member.user.username + ': ' + message.content );

	const defaultConfFile = constants.defaultConfigFile;
	const confFile = './config/' + message.guild.id + '.json';
	//Load configuration from server json. If it doesn't exist, it uses default.json.
	fs.exists( confFile, (exists) => {
		if ( exists ) 
			return;
		else
			return confFile = defaultConfFile;
	});
	const config = jsonfile.readFileSync(confFile);

	const msg = message.content.trim().toLowerCase();

	const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);

	switch (msg) {

		case 'ping':
			message.reply( wrap('pong') ); break;

		case 'lo quesea':
			message.reply( wrap('tu ereh tonto') ); break;

		// Send the user's avatar URL
		case 'what is my avatar':
			message.reply( message.author.avatarURL ); break;

		case 'music help':
			message.channel.send( wrap(constants.musicHelp) ); break;

		case 'playlist edit help':
			message.channel.send( wrap(constants.playlistEditHelp)); break;

		case 'help':
			message.channel.send(wrap(constants.help));
			if ( message.member.hasPermission("MANAGE_ROLES") )
				message.channel.send( wrap( 'For admin commands help type "admin help".' ) );
			message.channel.send( wrap('For music command help type "music help".') ); break;

		case 'admin help':
			if ( message.member.hasPermission("MANAGE_ROLES") )
				message.channel.send( wrap( constants.adminHelp ) );
			else
				message.channel.send( wrap( constants.permissionError ) );
			break;

		case 'permissions help':
			var permissionString = "";
			permissions.forEach(function(permission){
				permissionString += '\n' + permission;
			});
			message.reply ( wrap( 'The available permissions are:' + permissionString ) ); break;

		case 'currentsettings':
			message.channel.send(wrap(JSON.stringify(config, null, 2))); break;

		//JEJE TROLLASO
		case 'report':
			message.channel.send( wrap('apachin') ); break;

		case 'mercy':
			message.reply( wrap('LA MERCY ESTÁ HACKEADAAAAAAAAAAAAAAAA') ); break;

		case 'hack the planet':
			if ( typeof message.member.voiceChannel === "undefined" )
				return message.reply( wrap('How am I supposed to hack the planet if every time I hack the Mercy you don\'t follow, tontito.') );
			if ( voiceConnection === null ){
				message.member.voiceChannel.join().then( connection => {
					const dispatcher = connection.playFile('./static/asustame.mp3');
					message.reply(wrap('Ay pobresito'));
					dispatcher.on('end', (reason) => {
						connection.disconnect();
					});
				}); 
			} else
				message.reply( wrap('Cannot hack anything while I am playing music, tontito. BTW, I hate tontitos.'));
			break;


		case 'heal me':
			if ( typeof message.member.voiceChannel === "undefined" )
				return message.reply( wrap('How am I supposed to heal you if you are not here, idiot.') );
			if ( voiceConnection === null ){
				message.member.voiceChannel.join().then( connection => {
					const dispatcher = connection.playFile('./static/healing.mp3');
					message.reply(wrap('I NID JILIN'));
					dispatcher.on('end', (reason) => {
						connection.disconnect();
					});
				}); 
			} else
				message.reply( wrap('Cannot heal you while I am playing music, idiot. BTW, I hate idiots.'));
			break;

		case 'pi':
			message.channel.send(wrap(Math.PI.toString()));
			break;
	}

	if ( msg.startsWith( 'purge' ) ) {

		const PURGE_PERMISSION = (config.permissions.purge_permission.toUpperCase()) || "MANAGE_MESSAGES";

		if ( message.member.hasPermission( PURGE_PERMISSION, false, true, true ) ){

			const command = msg.split(/[ \n]/)[0].trim();
			const suffix = msg.substring(command.length).trim();

			if ( !isNaN(suffix) ) {
				message.channel.bulkDelete( parseInt( suffix ) + 1 );
				if ( config.general.purge_message )
					message.channel.send( wrap( 'Deleted ' + suffix + ' messages.' ) );

			} else
				message.channel.send( wrap( 'You must write a number of messages to delete.' ) );

		} else {
			message.reply( wrap(constants.permissionError) );
		}
	}

	if ( msg.startsWith( 'ca' ) && msg.endsWith( 't' ) ) {
		cat ( client, message );
	}

	if ( msg.startsWith( 'pe' ) && msg.endsWith('ne') ) {
		let e = msg. split ( "e" ) . length - 2 ;
/*		let str = '8';
		for ( let i = 0; i < e; i++ )
			str += '=';
		str += 'D~';
		message.channel.send(str);*/
		if ( e > 50 ) { e = 50 ; }
		let filename = Date.now();
		let pos = 45 ; // Length of the cat's pussy so that the first piece of trunk is generated in the right place
		let bodywidth = 15 ;
		let catlength = pos + e * bodywidth ;
		// We create the ass of the penis
		let catimg = gm ( )
			.in ( "-page" , "+ 0 + 0" )
			.in ( "./static/pene/root.png" ) ;

		// And we add, as it were, successively bits of trunks as a function of the length of the feline
		for ( pos ; pos < catlength ; pos += bodywidth ) {
			catimg
				.in( "-page" , "+" + pos + "+0" )
				.in( "./static/pene/body.png" ) ;
		}
		// Create the head of the matou and save the file
		catimg
			.in ( "-page" , "+" + pos + "+0" )
			.in ( "./static/pene/head.png" )
			.background ( "transparent" )
			.mosaic ( )
			.write ( "./static/pene/" + filename + ".png" , function ( e ) {
				if ( e ) { console.log ( e ) ; }
				message.channel.send ( '', { files: ["./static/pene/" + filename + ".png"] } );
			}); 
			setTimeout( function () {
					fs.unlink( "./static/pene/" + filename + ".png" , (err) => {
						if (err)
							console.log(err);
					})}, 2000);

		var audio;

		if ( e > 0 && e <= 4 ) audio = './static/pene/p1.mp3';	
		else if (e > 4 && e <= 8 ) audio = './static/pene/p2.mp3';	
		else if (e > 8 && e <= 12 ) audio = './static/pene/p3.mp3';	
		else if (e > 12 && e <= 16 ) audio = './static/pene/p4.mp3';
		else if (e > 16 && e <= 20 ) audio = './static/pene/p5.mp3';
		else if (e > 20 && e <= 24 ) audio = './static/pene/p6.mp3';
		else if (e > 24 && e <= 28 ) audio = './static/pene/p7.mp3';
		else if (e > 28 && e <= 32 ) audio = './static/pene/p8.mp3';
		else if (e > 32 && e <= 36 ) audio = './static/pene/p9.mp3';
		else if (e > 36 && e <= 40 ) audio = './static/pene/p10.mp3';
		else if (e > 40 && e <= 50 ) audio = './static/pene/p11.mp3';
		if ( typeof audio === 'undefined' ) return;

		if ( typeof message.member.voiceChannel === "undefined" )
			return;
		if ( voiceConnection === null ){
			message.member.voiceChannel.join().then( connection => {
				const dispatcher = connection.playFile( audio );
				dispatcher.on('end', (reason) => {
					connection.disconnect();
				});
			}); 
		} else
			return;
		
	}

	if ( msg.startsWith('img') ) {
		const command = msg.split(/[ \n]/)[0].trim();
		var suffix = msg.substring(command.length).trim();
		if ( suffix == '' )
			return message.reply(wrap('You must enter a search term!'));
		var imgNumber = suffix.split('(').length === 2 ? suffix.split('(')[1].split(')')[0] : null;
		if ( imgNumber === null ){
			suffix = suffix.split('(')[0];
			imgNumber = 1;
		}
		if ( isNaN(imgNumber) )
			return message.reply(wrap('You must enter a number in the parenthesis!'));

		const img = imageClient.search(suffix, {safe:'off'}).then( img => {
			if ( !(typeof img[imgNumber-1] === "undefined") )
				message.reply(img[imgNumber - 1].url);
			else 
				message.reply(wrap('Number must be between 1 and 10'));
		});
	}

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
