const getErrorMessage = (error, fallback = "Something went wrong.") => {
  if (typeof error === "string" && error.trim()) return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallback;
};

export default getErrorMessage;
