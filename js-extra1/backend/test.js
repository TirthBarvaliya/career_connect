const previousStatus = "Offer Sent";
const status = "Hired";
const finalStatuses = new Set(["Selected", "Hired", "Rejected", "Accepted"]);

console.log("finalStatuses.has(previousStatus):", finalStatuses.has(previousStatus));
console.log("status !== 'Review':", status !== "Review");
console.log("Will throw error:", finalStatuses.has(previousStatus) && status !== "Review");
