const { program } = require('commander');
const fs = require('fs');
const http = require('http');
const path = require('path');
const superagent = require('superagent');

program
  .option('-h, --host <host>', 'server host')
  .option('-p, --port <port>', 'server port')
  .option('-c, --cache <dir>', 'path to cache directory')

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

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`Created cache directory: ${cacheDir}`);
} else {
  console.log(`Cache directory exists: ${cacheDir}`);
}

const server = http.createServer(async (req, res) => {
  const method = req.method;
  const code = req.url.slice(1);
  const filepath = path.join(cacheDir, `${code}.jpg`);

  console.log(`Request: ${method} ${req.url}`);

  if (!/^\d+$/.test(code)) {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Invalid request (expected HTTP status code)");
  }

  switch (method) {
    case "GET":
    try {
        const fileData = await fs.promises.readFile(filepath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        return res.end(fileData); 
    } catch (err) {
        console.log("Not found in cache. Trying http.cat ...");
    }

    try {
        const catResponse = await superagent.get(`https://http.cat/${code}`);
        await fs.promises.writeFile(filepath, catResponse.body);

        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(catResponse.body);
    } catch (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Image not found on server or http.cat");
    }
    break;

    case "PUT":
        try {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }

            const img = Buffer.concat(chunks);
            await fs.promises.writeFile(filepath, img);

            res.writeHead(201, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Image saved to cache");
        } catch (err) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Error writing file");
        }
        break;

    case "DELETE":
        try {
            await fs.promises.unlink(filepath); // <-- fixed here
            res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Image deleted");
        } catch (err) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Image not found");
        }
        break;

    default:
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Method not allowed");
  }
});

server.listen(Number(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});
