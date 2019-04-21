var ws = require('ws').Server;
var wss = new ws({ port: 2333 });
var allUsers = [];

process.on('uncaughtException', function(err) {
    console.log(err);
});
wss.on('connection', function(ws) {
    console.log('serve is started');
    ws.on('message', function(message) {
        var message = JSON.parse(message);
        if (message['type'] === 'add') {
            sendNew(ws, 'add');
            sendOther(ws, message['name'], message['pos'], 'add', message['rotation']);
            allUsers.push({ "ws": ws, "name": message['name'], "pos": message['pos'], "type": 'add', "rotation": message['rotation'] });
        } else if (message['type'] === 'move') {
            for (var i = 0; i < allUsers.length; i++) {
                if (allUsers[i]['ws'] === ws) {
                    allUsers[i]['pos'] = message['pos'];
                    break;
                }
            }
            wss.clients.forEach(function(client) {
                client.send(JSON.stringify({ "name": message['name'], "pos": message['pos'], "type": 'move', "rotation": message['rotation'] }));
            })
        }
    });
    ws.on('close', function() {
        var tmp = -1;
        for (var i = 0; i < allUsers.length; i++) {
            if (allUsers[i]['ws'] === ws) {
                tmp = i;
                break;
            }
        }
        if (tmp === -1) {
            //console.log('无效ws');
            //do nothing
        } else {
            sendOther(ws, allUsers[tmp]['name'], allUsers[tmp]['pos'], 'delete', allUsers[tmp]['rotation']);
            allUsers.splice(tmp, 1);
        }
    })
});

function sendNew(ws, type) {
    //console.log(ws);
    for (var i = 0; i < allUsers.length; i++) {
        if (allUsers[i]['ws'] !== ws) {
            if (ws.readyState !== 3) {
                ws.send(JSON.stringify({ name: allUsers[i]['name'], type: type, pos: allUsers[i]['pos'], rotation: allUsers[i]['rotation'] }));
            }
        }
    }
}

function sendOther(ws, name, pos, type, rotation) {
    for (var i = 0; i < allUsers.length; i++) {
        if (allUsers[i]['ws'] !== ws) {
            if (ws.readyState !== 3) {
                allUsers[i]['ws'].send(JSON.stringify({ name: name, type: type, pos: pos, rotation: rotation }));
            }
        }
    }
}