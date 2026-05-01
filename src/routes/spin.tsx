import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/spin")({
  beforeLoad: () => { throw redirect({ to: "/games" }); },
});
