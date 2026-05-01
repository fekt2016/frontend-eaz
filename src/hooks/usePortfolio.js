import { useEffect, useState } from "react";

export function usePortfolioFilter(projects) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState(projects);

  useEffect(() => {
    let next = projects;
    if (activeCategory && activeCategory !== "All") {
      next = next.filter((p) => p.category === activeCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      next = next.filter((p) => {
        const haystack = [
          p.title,
          p.client,
          p.shortDesc,
          ...(p.tags || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    setFilteredProjects(next);
  }, [projects, activeCategory, searchQuery]);

  const setCategory = (cat) => setActiveCategory(cat);
  const setSearch = (q) => setSearchQuery(q);

  return {
    activeCategory,
    searchQuery,
    filteredProjects,
    setCategory,
    setSearch,
    resultCount: filteredProjects.length,
  };
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const openModal = (project) => {
    setSelectedProject(project);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedProject(null);
  };

  return { isOpen, selectedProject, openModal, closeModal };
}

