var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);
server.listen(3001);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var players = {} // sid和socket对象映射关系 id:socket
var relations = {} // 每个玩家和对手的对应关系  id1:id2   id2:id1

io.sockets.on('connection', socket=> {
    console.log("connected!");
    const sid = socket.id;

    players[sid] = socket;

    // 其他用户链接主机
    socket.on('link', d=> {
        const linkdata = JSON.parse(d);
        if( linkdata.target !== linkdata.sid ) {
            //防止自己连接自己
            relations[linkdata.target] = linkdata.sid; // sid 主动发起连接的主机
            relations[linkdata.sid] = linkdata.target; // target 被连接主机
            if(players[linkdata.sid] && players[linkdata.target] ) {
                //防止输入错误socket ID导致server崩溃
                players[linkdata.sid].emit('linkOK', 'linkOK');
                players[linkdata.target].emit('linked', 'linked');
            }else{
                players[linkdata.sid].emit('linkFail', 'linkFail');
            }
        }
    });

    // 落子后双方同步棋子信息
    socket.on('tick', d=> {
        const data = JSON.parse(d)
        // 查询对手socket 并返回信息
        players[relations[socket.id]].emit('tick-back', d)
    });

    socket.on('restart', ()=> {
        players[relations[socket.id]].emit('restartConfirm', '');
    });

    socket.on('confirmRestart', ()=> {
        players[relations[socket.id]].emit('restartGame', '');
    });

    socket.on('disconnect', ()=>{
        // TODO 断开连接
    })
});
