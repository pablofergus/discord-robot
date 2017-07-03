const gm = require ( "gm" ) ;
const fs = require ( "fs" ) ;

module.exports = function ( bot , message ) {

	let filename = Date.now();
	let pos = 62 ; // Length of the cat's pussy so that the first piece of trunk is generated in the right place
	let bodywidth = 15 ;
	let command ;
 
	command = message. content . split ( / \ s / ) [ 0 ] ; // We take into account only the contents of the command and no characters after ycelle
 
	let a = command. split ( "a" ) . length - 2 ; // count the number of "a" of the command
	if ( a > 50 ) { a = 50 ; } // we put a limit because we must not abuse
	let catlength = pos + a * bodywidth ;
 
	// We create the ass of the cat
	let catimg = gm ( )
		. in ( "-page" , "+ 0 + 0" )
		. in ( "./static/cat/catbutt.png" ) ;
 
	// And we add, as it were, successively bits of trunks as a function of the length of the feline
	for ( pos ; pos < catlength ; pos += bodywidth ) {
		catimg
			.in( "-page" , "+" + pos + "+0" )
			.in( "./static/cat/catbody.png" ) ;
	}
	// Create the head of the matou and save the file
	catimg
		.in ( "-page" , "+" + pos + "+0" )
		.in ( "./static/cat/cathead.png" )
		.background ( "transparent" )
		.mosaic ( )
		.write ( "./static/cat/" + filename + ".png" , function ( e ) {
			if ( e ) { console.log ( e ) ; }
			message.channel.send ( '', { files: ["./static/cat/" + filename + ".png"] } ).catch(console.error);
		} ) ;
	const dir = "./static/cat/" + filename + ".png";
	console.log( !fs.existsSync( dir ) );
	fs.unlink( dir , err => {
		if (err)
			return console.log(err);;
	});
}