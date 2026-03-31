const baseUrl = process.env.CHECK_URL || "http://localhost:6001/api/career-ai";
const message = process.env.CHECK_MESSAGE || "Create a roadmap for Full Stack Developer beginner level";

const run = async () => {
  const startedAt = Date.now();
  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history: []
      })
    });

    const bodyText = await response.text();
    const elapsed = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log(`Status: ${response.status} | ${elapsed}ms`);
    // eslint-disable-next-line no-console
    console.log(bodyText);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("CareerAI check failed:", error.message);
    process.exit(1);
  }
};

run();
