const baseUrl = process.env.CHECK_URL || "http://localhost:6001/api/health";

try {
  const response = await fetch(baseUrl);
  const body = await response.text();
  // eslint-disable-next-line no-console
  console.log(`Status: ${response.status}`);
  // eslint-disable-next-line no-console
  console.log(body);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("Health check failed:", error.message);
  process.exit(1);
}
