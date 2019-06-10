const ws = require("ws");
const wss = new ws.Server({port: 8000});
const libtextmode = require("./js/libtextmode/libtextmode");
let doc;
const pass = "secret";
const action =  {CONNECTED: 0, REFUSED: 1, JOIN: 2, LEAVE: 3, CURSOR: 4, SELECTION: 5, RESIZE_SELECTION: 6, OPERATION: 7, HIDE_CURSOR: 8, DRAW: 9, CHAT: 10};
const data_store = [];
let timer;

function send(ws, type, data = {}) {
    ws.send(JSON.stringify({type, data}));
}

function send_all(sender, type, data = {}) {
    for (const ws of wss.clients) {
        if (ws != sender) {
            send(ws, type, data);
        }
    }
}

function message(ws, msg) {
    switch (msg.type) {
    case action.CONNECTED:
        if (!pass || msg.data.pass == pass) {
            const id = data_store.length;
            data_store.push({user: {nick: msg.data.nick, id: id}, ws: ws});
            send(ws, action.CONNECTED, {id, doc, users: data_store.map(data => data.user)});
            send_all(ws, action.JOIN, {id, nick: msg.data.nick});
            console.log(`${msg.data.nick} has joined`);
        } else {
            send(ws, action.REFUSED);
            console.log(`${msg.data.nick} was refused`);
        }
    break;
    case action.DRAW:
        doc.data[msg.data.y * doc.columns + msg.data.x] = Object.assign(msg.data.block);
        send_all(ws, msg.type, msg.data);
    break;
    default:
        send_all(ws, msg.type, msg.data);
    }
}

function save() {
    libtextmode.write_file(doc, "./server.ans");
}

libtextmode.read_file("./server.ans").then((ansi_doc) => {
    timer = setInterval(save, 5 * 60 * 1000);
    doc = ansi_doc;
    wss.on("connection", (ws) => {
        ws.on("message", msg => message(ws, JSON.parse(msg)));
        ws.on("close", () => {
            for (let i = 0; i < data_store.length; i++) {
                if (data_store[i].ws == ws) {
                    const user = data_store[i].user;
                    console.log(`${user.nick} has left`);
                    send_all(ws, action.LEAVE, {id: user.id});
                    data_store.splice(i, 1);
                }
            }
        });
    });
});

process.on("SIGINT", () => {
    clearInterval(timer);
    wss.close();
    save();
    console.log("\nProcess ended.");
});
