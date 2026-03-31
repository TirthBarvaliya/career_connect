import { useEffect } from "react";

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = `${title} | Career connect`;
  }, [title]);
};

export default usePageTitle;
