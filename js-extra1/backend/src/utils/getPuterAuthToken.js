import { getAuthToken } from "@heyputer/puter.js/src/init.cjs";

const run = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      // eslint-disable-next-line no-console
      console.error("Could not get Puter auth token.");
      process.exit(1);
      return;
    }

    // eslint-disable-next-line no-console
    console.log("\nCopy this into backend/.env and restart backend:\n");
    // eslint-disable-next-line no-console
    console.log(`PUTER_AUTH_TOKEN=${token}\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to generate Puter auth token:", error?.message || "Unknown error");
    process.exit(1);
  }
};

run();
