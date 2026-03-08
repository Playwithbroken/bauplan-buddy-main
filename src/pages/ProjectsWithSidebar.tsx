import { LayoutWithSidebar } from "@/components/LayoutWithSidebar.tsx";
import Projects from "@/pages/Projects.tsx";

const ProjectsWithSidebar = () => {
  return (
    <LayoutWithSidebar>
      <Projects />
    </LayoutWithSidebar>
  );
};

export default ProjectsWithSidebar;