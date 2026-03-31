import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../utils/api";
import getErrorMessage from "../../utils/errorMessage";

export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async (params = {}, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/jobs", { params });
    return response.data.jobs || [];
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load jobs."));
  }
});

export const fetchSavedJobs = createAsyncThunk("jobs/fetchSavedJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/users/saved-jobs");
    return response.data.jobs || [];
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load saved jobs."));
  }
});

export const fetchAppliedJobs = createAsyncThunk("jobs/fetchAppliedJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/users/applied-jobs");
    return response.data.applications || [];
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load applied jobs."));
  }
});

export const saveJobAsync = createAsyncThunk("jobs/saveJob", async (jobId, { rejectWithValue }) => {
  try {
    await apiClient.post(`/users/saved-jobs/${jobId}`);
    return jobId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to save job."));
  }
});

export const unsaveJobAsync = createAsyncThunk("jobs/unsaveJob", async (jobId, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/users/saved-jobs/${jobId}`);
    return jobId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to remove saved job."));
  }
});

export const applyToJobAsync = createAsyncThunk("jobs/applyToJob", async (jobId, { rejectWithValue }) => {
  try {
    await apiClient.post(`/jobs/${jobId}/apply`);
    return jobId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to apply for this job."));
  }
});

export const withdrawApplicationAsync = createAsyncThunk(
  "jobs/withdrawApplication",
  async (jobId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/jobs/${jobId}/apply`);
      return jobId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Unable to withdraw this application."));
    }
  }
);

export const createJobAsync = createAsyncThunk("jobs/createJob", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/jobs", payload);
    return response.data.job;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to create job listing."));
  }
});

const jobSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [],
    savedJobIds: [],
    appliedApplications: [],
    appliedJobIds: [],
    status: "idle",
    error: null
  },
  reducers: {
    clearJobMeta: (state) => {
      state.savedJobIds = [];
      state.appliedApplications = [];
      state.appliedJobIds = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.jobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch jobs.";
      })
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        state.savedJobIds = action.payload.map((job) => job.id || job._id);
      })
      .addCase(fetchAppliedJobs.fulfilled, (state, action) => {
        state.appliedApplications = action.payload;
        state.appliedJobIds = action.payload
          .filter((application) => application.status !== "Withdrawn")
          .map((application) => application.job?.id || application.job?._id)
          .filter(Boolean);
      })
      .addCase(saveJobAsync.fulfilled, (state, action) => {
        if (!state.savedJobIds.includes(action.payload)) {
          state.savedJobIds.push(action.payload);
        }
      })
      .addCase(unsaveJobAsync.fulfilled, (state, action) => {
        state.savedJobIds = state.savedJobIds.filter((jobId) => jobId !== action.payload);
      })
      .addCase(applyToJobAsync.fulfilled, (state, action) => {
        if (!state.appliedJobIds.includes(action.payload)) {
          state.appliedJobIds.push(action.payload);
        }
      })
      .addCase(withdrawApplicationAsync.fulfilled, (state, action) => {
        state.appliedJobIds = state.appliedJobIds.filter((jobId) => jobId !== action.payload);
        state.appliedApplications = state.appliedApplications.map((application) => {
          const applicationJobId = application.job?.id || application.job?._id;
          if (applicationJobId !== action.payload) return application;
          return { ...application, status: "Withdrawn", canWithdraw: false };
        });
      })
      .addCase(createJobAsync.fulfilled, (state, action) => {
        if (action.payload) {
          state.jobs.unshift(action.payload);
        }
      });
  }
});

export const { clearJobMeta } = jobSlice.actions;
export default jobSlice.reducer;
