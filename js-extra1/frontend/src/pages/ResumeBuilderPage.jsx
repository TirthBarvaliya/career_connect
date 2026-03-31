import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ResumeBuilderPanel from "../components/resume/ResumeBuilderPanel";
import usePageTitle from "../hooks/usePageTitle";
import apiClient from "../utils/api";
import { useDispatch } from "react-redux";
import { addToast } from "../redux/slices/uiSlice";
import getErrorMessage from "../utils/errorMessage";

const ResumeBuilderPage = () => {
  usePageTitle("Resume Builder");
  const dispatch = useDispatch();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const response = await apiClient.get("/users/profile");
        if (!active) return;
        
        let fetchedProfile = response.data.profile;
        
        // If coming from ATS Checker with enhanced resume data, inject it
        if (location.state?.enhancedResume) {
           fetchedProfile = {
               ...fetchedProfile,
               resumeBuilder: {
                   ...fetchedProfile.resumeBuilder,
                   ...location.state.enhancedResume,
                   template: location.state.themeId || fetchedProfile.resumeBuilder?.template || "modern"
               }
           };
        }
        
        setProfile(fetchedProfile);
      } catch (error) {
        dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load resume builder.") }));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [dispatch, location.state]);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-16 w-2/5" />
        <LoadingSkeleton className="h-[650px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel p-5">
        <h2 className="font-poppins text-2xl font-semibold text-slate-900 dark:text-white">
          Resume Builder Workspace
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Build in a full editor, preview template changes live, then download or upload PDF to your profile.
        </p>
      </div>
      <ResumeBuilderPanel profile={profile} onProfileUpdated={setProfile} variant="page" />
    </div>
  );
};

export default ResumeBuilderPage;

