const net = require('node:net');
const PacketParser = require('../server/node_modules/mysql2/lib/packet_parser.js');
const MYSQL = require('../src/constants/mysql');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3306;

const [host1, port1] = _hostPort(2);
const [host2, port2] = _hostPort(3);

if (!host2) {
  _usage();
  process.exit(-1);
}

const server = net.createServer();
server.on('connection', (socket) => {
  console.log('server: new connection');
  socket.pause();

  const client_pp = new PacketParser((p) => {
    _logPacket('  clientpp', p, true);
  });
  const pp1 = new PacketParser((p) => {
    _logPacket('  server1pp', p);
  });
  const pp2 = new PacketParser((p) => {
    _logPacket('  server2pp', p);
  });

  let upstream1_connected = false;
  let upstream2_connected = false;
  function _maybeUnpause() {
    if (upstream1_connected && upstream2_connected) {
      socket.resume();
    }
  }
  const upstream1 = net.createConnection(port1, host1, () => {
    console.log('upstream1: connected');
    upstream1_connected = true;
    _maybeUnpause();
  });
  const upstream2 = net.createConnection(port2, host2, () => {
    console.log('upstream2: connected');
    upstream2_connected = true;
    _maybeUnpause();
  });

  upstream1.on('data', (buffer) => {
    console.log('1---->:', buffer.length, buffer.toString('hex'));
    socket.write(buffer);
    pp1.execute(buffer);
  });
  upstream2.on('data', (buffer) => {
    console.log('2---->:', buffer.length, buffer.toString('hex'));
    pp2.execute(buffer);
  });
  upstream1.on('error', _errorHandler('upstream1'));
  upstream2.on('error', _errorHandler('upstream2'));

  socket.on('data', (buffer) => {
    console.log('<-----:', buffer.length, buffer.toString('hex'));
    upstream1.write(buffer);
    upstream2.write(buffer);
    client_pp.execute(buffer);
  });
  socket.on('error', _errorHandler('server'));
  socket.on('end', () => {
    console.log('server: end');
  });
});
server.listen(PORT);
console.log('server: listen:', PORT);

function _errorHandler(name) {
  return (err) => {
    console.log(name, 'error:', err);
  };
}
function _logPacket(prefix, packet, is_client) {
  const { buffer, start, offset, end } = packet;
  const cmd_unit =
    buffer.length > offset ? buffer.readUInt8(offset) : undefined;
  const map = is_client ? MYSQL.CLIENT_COMMAND_MAP : MYSQL.SERVER_COMMAND_MAP;
  const command = map[cmd_unit];
  console.log(
    prefix,
    packet.sequenceId,
    buffer.slice(start, offset).toString('hex'),
    command ?? (is_client ? 'unknown' : '-'),
    buffer.slice(offset, end).toString('hex')
  );
}
function _hostPort(num) {
  const [host, port] = process?.argv?.[num]?.split?.(':') ?? [];
  return [host, parseInt(port)];
}
function _usage() {
  console.log(process.argv[1], '<host1>:<port1>', '<host2>:<port2>');
}
