import { createFileRoute } from "@tanstack/react-router";

import { NewCandidatePage } from "@/components/candidates/new-candidate-page";

export const Route = createFileRoute("/candidates/new")({
  component: NewCandidatePage,
  head: () => ({ meta: [{ title: "Novo candidato | CIEE/PR" }] }),
});
