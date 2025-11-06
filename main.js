const { program } = require('commander');
const fs = require('fs');
const http = require('http');
const path = require('path');
const superagent = require('superagent');

program
  .option('-h, --host <host>','server host')
  .option('-p, --port <port>', 'server port')
  .option('-c, --cache <dir>','path to cache directory')

program.parse();
const options = program.opts();

if (!options.host) {
    console.error('Please, specify host parameter');
    process.exit(1);
}

if (!options.port) {
    console.error('Please, specify port parameter');
    process.exit(1);
}

if (!options.cache) {
    console.error('Please, specify directory parameter');
    process.exit(1);
}

const cacheDir = path.resolve(options.cache);

if(!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log(`Created cache directory: ${cacheDir}`);
} else {
    console.log(`Cache directory exists: ${cacheDir}`);
}

const server = http.createServer( (req, res) => {
   res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
   res.end(`Server is running. Cache directory: ${cacheDir}`);
});

server.listen(Number(options.port), options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});