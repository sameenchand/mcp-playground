import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "About — MCP Playground",
  description: "Learn about MCP Playground and the Model Context Protocol.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-2">About MCP Playground</h1>
      <p className="text-muted-foreground mb-8">
        Test any MCP server live in your browser before installing it.
      </p>

      <Separator className="mb-8" />

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What is this?</h2>
          <p>
            MCP Playground is a web app for developers to browse, inspect, and interactively test
            MCP (Model Context Protocol) servers — directly in the browser, without any local setup.
            Think of it as Swagger UI for the MCP ecosystem.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What is MCP?</h2>
          <p>
            The Model Context Protocol is an open standard for connecting AI assistants to external
            tools, data sources, and services. Servers expose tools, resources, and prompts that AI
            clients can call.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Tech Stack</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Next.js 15", "TypeScript", "Tailwind CSS", "shadcn/ui", "MCP SDK"].map((tech) => (
              <Badge key={tech} variant="secondary" className="font-mono text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
