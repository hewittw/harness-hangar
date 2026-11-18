/** Public origin of the site, used in links the MCP tools and pages show. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  // Preview deployments link to themselves; production links to the production domain.
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL) return `https://${process.env.VERCEL_BRANCH_URL}`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
