import { DEFAULT_LIST_CANDIDATES_QUERY } from "@ciee-curriculos/shared";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      search: DEFAULT_LIST_CANDIDATES_QUERY,
      to: "/candidates",
    });
  },
});
