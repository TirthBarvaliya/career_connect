const toPostedMeta = (createdAt) => {
  const createdMs = new Date(createdAt).getTime();
  const diffHours = Math.max(1, Math.round((Date.now() - createdMs) / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return { postedHours: diffHours, postedAt: `${diffHours} hours ago` };
  }
  const days = Math.round(diffHours / 24);
  return { postedHours: diffHours, postedAt: `${days} day${days > 1 ? "s" : ""} ago` };
};

const mapJobForClient = (jobDoc) => {
  const job = jobDoc.toObject ? jobDoc.toObject() : jobDoc;
  const postedMeta = toPostedMeta(job.createdAt);
  return {
    ...job,
    id: String(job._id),
    relevance: job.relevance || 80,
    ...postedMeta
  };
};

export { mapJobForClient, toPostedMeta };
