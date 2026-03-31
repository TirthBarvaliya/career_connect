import mongoose from "mongoose";
import config from "./env.js";

const sanitizeMongoUri = (value) => String(value || "").trim().replace(/^['"]|['"]$/g, "");

const buildSrvCandidatesFromSeedlistUri = (safeUri) => {
  // Example source host:
  // ac-9z95vfa-shard-00-00.dnopw6x.mongodb.net
  const match = safeUri.match(/^mongodb:\/\/([^@]+)@([^/]+)\/([^?]*)(\?.*)?$/i);
  if (!match) return [];

  const authPart = match[1];
  const hostsPart = match[2];
  const dbPart = match[3] || "";
  const query = "retryWrites=true&w=majority";
  const databaseName = dbPart || "test";
  const results = [];

  const firstHostWithPort = hostsPart.split(",")[0] || "";
  const firstHost = firstHostWithPort.split(":")[0];
  const atlasHostMatch = firstHost.match(/^(ac-[^-]+)-shard-\d{2}-\d{2}\.(.+)$/i);
  if (!atlasHostMatch) return results;

  const clusterKey = atlasHostMatch[1];
  const domain = atlasHostMatch[2];
  const srvHosts = [`${clusterKey}.${domain}`, `cluster0.${domain}`];

  srvHosts.forEach((srvHost) => {
    const candidate = `mongodb+srv://${authPart}@${srvHost}/${databaseName}?${query}`;
    if (!results.includes(candidate)) results.push(candidate);
  });

  return results;
};

const buildSrvCandidatesFromSrvUri = (safeUri) => {
  const match = safeUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/]+)\/([^?]*)(\?.*)?$/i);
  if (!match) return [];

  const authPart = match[1];
  const host = match[2];
  const dbPart = match[3] || "";
  const query = match[4] ? match[4].replace(/^\?/, "") : "retryWrites=true&w=majority";
  const databaseName = dbPart || "test";
  const results = [];

  const acHostMatch = host.match(/^(ac-[^.]+)\.(.+)$/i);
  if (acHostMatch) {
    const domain = acHostMatch[2];
    const cluster0Host = `cluster0.${domain}`;
    const candidate = `mongodb+srv://${authPart}@${cluster0Host}/${databaseName}?${query}`;
    if (!results.includes(candidate)) results.push(candidate);
  }

  return results;
};

const buildAtlasSrvFallbacks = (uri) => {
  const safeUri = sanitizeMongoUri(uri);
  if (!safeUri) return [];
  if (safeUri.startsWith("mongodb://")) {
    return buildSrvCandidatesFromSeedlistUri(safeUri);
  }
  if (safeUri.startsWith("mongodb+srv://")) {
    return buildSrvCandidatesFromSrvUri(safeUri);
  }
  return [];
};

const buildCandidateUris = (rawUri) => {
  const primary = sanitizeMongoUri(rawUri);
  const candidates = primary ? [primary] : [];

  const fallbacks = buildAtlasSrvFallbacks(primary);
  fallbacks.forEach((fallback) => {
    if (fallback && !candidates.includes(fallback)) candidates.push(fallback);
  });

  return candidates;
};

const readUriHost = (uri) => {
  const match = String(uri || "").match(/@([^/?]+)/);
  return match ? match[1] : "unknown-host";
};

const mapMongoConnectionError = (error) => {
  const message = String(error?.message || "");
  const lower = message.toLowerCase();

  if (lower.includes("authentication failed")) {
    return new Error(
      "MongoDB Atlas authentication failed. Verify database username/password and ensure special characters in password are URL-encoded."
    );
  }
  if (lower.includes("ip") && lower.includes("whitelist")) {
    return new Error(
      "MongoDB Atlas network access denied. Add your current IP in Atlas Network Access (or allow 0.0.0.0/0 for testing)."
    );
  }
  if (lower.includes("server selection timed out")) {
    return new Error(
      "MongoDB Atlas connection timed out. Verify Atlas Network Access IP whitelist, cluster status, and firewall/outbound access to port 27017."
    );
  }
  if (lower.includes("querysrv") || lower.includes("enotfound") || lower.includes("getaddrinfo")) {
    return new Error(
      "MongoDB Atlas host resolution failed. Recheck MONGODB_URI host/options and your internet/DNS connectivity."
    );
  }

  return new Error(`MongoDB connection failed: ${message}`);
};

const isRetryableConnectionError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("authentication failed") || message.includes("bad auth")) return false;
  if (message.includes("ip") && message.includes("whitelist")) return false;

  return (
    message.includes("querysrv") ||
    message.includes("enotfound") ||
    message.includes("getaddrinfo") ||
    message.includes("server selection timed out") ||
    message.includes("econnrefused") ||
    message.includes("econnreset") ||
    message.includes("timed out")
  );
};

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  const candidates = buildCandidateUris(config.mongoUri);
  let primaryError = null;
  let lastError = null;
  if (config.env !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[db] Mongo connection candidates: ${candidates.map(readUriHost).join(" | ")}`);
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const uri = candidates[index];
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000
      });
      return mongoose.connection;
    } catch (error) {
      if (config.env !== "production") {
        // eslint-disable-next-line no-console
        console.error(
          `[db] Mongo connect attempt ${index + 1}/${candidates.length} failed (${readUriHost(uri)}): ${String(
            error?.message || error
          )}`
        );
      }
      if (index === 0) {
        primaryError = error;
      }
      lastError = error;

      // Keep trying next URI candidate only for retryable network/connectivity failures.
      // This avoids masking real auth/whitelist errors.
      const hasNextCandidate = index < candidates.length - 1;
      if (hasNextCandidate && isRetryableConnectionError(error)) {
        continue;
      }

      throw mapMongoConnectionError(error);
    }
  }

  throw mapMongoConnectionError(lastError || primaryError || new Error("Unknown MongoDB connection error."));
};

export default connectDB;
