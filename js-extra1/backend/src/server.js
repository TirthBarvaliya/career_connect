import config from "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";

const startServer = async () => {
  try {
    const connection = await connectDB();
    const server = app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${config.port} (db: ${connection.name}, env: ${config.env})`);
    });

    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        // eslint-disable-next-line no-console
        console.error(
          `Server startup failed: Port ${config.port} is already in use. Stop the existing process or change PORT in backend/.env.`
        );
      } else {
        // eslint-disable-next-line no-console
        console.error("Server startup failed:", error?.message || error);
      }
      process.exit(1);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
