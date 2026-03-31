import net from "net";

const startPort = Number(process.env.START_PORT || 6000);
const endPort = Number(process.env.END_PORT || 6500);

const checkPort = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "::");
  });

const find = async () => {
  for (let port = startPort; port <= endPort; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    const free = await checkPort(port);
    if (free) {
      // eslint-disable-next-line no-console
      console.log(port);
      return;
    }
  }
  // eslint-disable-next-line no-console
  console.log("NO_FREE_PORT");
};

find();
