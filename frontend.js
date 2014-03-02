$(function () {
    "use strict";

    var content = $('#content');
    var input = $('#input');
    var status = $('#status');

	// La couleur du client choisit aleatoirement par le serveur
    var myColor = false;
	// Le nom du client envoyer au serveur
    var myName = false;

	// si le client utilise mozilla alors on utilise le WebSocket inegree
    window.WebSocket = window.WebSocket || window.MozWebSocket;

	// Si le navigateur web ne support pas les WebSocket on informe le client et on quite
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Desoler, votre navigateur ne support pas les WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

	// initialisation de la connection
    var connection = new WebSocket('ws://'+host+':'+port);

    connection.onopen = function () {
		// Au debut on demande des clients de choisir un nom
        input.removeAttr('disabled');
        status.text('Choisit un nom:');
    };

    connection.onerror = function (error) {
		// Au cas de probleme de connection ...
        content.html($('<p>', { text: 'Desoler, Il existe un probleme aver la connection ou le serveur est en panne' } ));
    };

	// La partie la plus importante - un message est recu
    connection.onmessage = function (message) {
		// On valide la chaine JSON recu 
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('La chainne JSON recu n\'est pas valide: ', message.data);
            return;
        }

        if (json.type === 'color') {
            myColor = json.data;
            status.text(myName + ': ').css('color', myColor);
            input.removeAttr('disabled').focus();
        } else if (json.type === 'history') { 
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { 
            input.removeAttr('disabled'); 
            addMessage(json.data.author, json.data.text,
                       json.data.color, new Date(json.data.time));
        } else {
            console.log('Chaine JSON invalide: ', json);
        }
    };

    /**
     * L'envoi d'un message quand l'utilisateur appui sur "Enter"
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
			// Envoi le message comme text
            connection.send(msg);
            $(this).val('');
			// Desactiver la zone de saisie pour obliger le client d'attendre la reponse du serveur
            input.attr('disabled', 'disabled');
            if (myName === false) {
                myName = msg;
            }
        }
    });

    /**
	 * Cette alert le client si au bout de 3 secondes le message n'est pas valider par le serveur
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Incapabilite d\'etablire une connection avec le serveur.');
        }
    }, 3000);

    /**
	 * L'ajout d'un message a la feunetre du chat 
     */
    function addMessage(author, message, color, dt) {
        content.append('<p><span style="color:' + color + '">' + author + '</span> @ ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' + message + '</p>');
    }
});
