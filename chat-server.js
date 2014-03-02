// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

var config = require('config.js');

// Optionel. Le nom du processus si on utilise par exemple les commandes 'ps' ou 'top'
process.title = 'node-chat';

// Le port que le serveur de websocket utilisera
var webSocketsServerPort = config.port;

// initialisation des serveur websocket et http
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Variables globales
 */
// Les derniers 100 messages
var history = [ ];
// La liste des clients connecter (utilisateurs)
var clients = [ ];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Une liste contenant quelque couleurs
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... avec un ordre randomiser
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * Le serveur HTTP
 */
var server = http.createServer(function(request, response) {

});
server.listen(webSocketsServerPort,"0.0.0.0", function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * Serveur WebSocket
 */
var wsServer = new webSocketServer({
	// Le serveur Websocket est attacher a un serveur HTTP.
	// WebSocket n'est autre qu'une requette HTTP améliorée.
	// Pour plus d'information consulter http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});
	//Cette function est appellée chaque fois quelqu'un essaie de se connecter a ce serveur.
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

	// accepter la connexion - Il faut d'abord verifier l'orogine de la requette recu 'request.origin'
	// pour s'assurer que la connection est issue de votre site web.
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
	// On doit connetre le numero du client pour l'enlever lors de l'elevenement 'close'
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

	// Renvoyer les messages precedents
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

	// Lorsqu'un utilisateur envoi un message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // Valide que le message est du type text
            if (userName === false) { // Le premier message envoyer est utiliser comme le nom de l'utilisateur
                userName = htmlEntities(message.utf8Data);
				// Choisit une couleur aleatoirement et revoit la au client
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName
                            + ' with ' + userColor + ' color.');

            } else { // Ecrire le message dans le log et le diffuser
                console.log((new Date()) + ' Received Message from '
                            + userName + ': ' + message.utf8Data);
                
                // L'ajouter aussi au message precedents
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);

				// Diffuse le message au clients connecter
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});

