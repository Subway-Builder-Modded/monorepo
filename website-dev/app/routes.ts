import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Manual route definitions for initial setup.
// Can be switched to file-based routing via @react-router/fs-routes:
//   import { flatRoutes } from '@react-router/fs-routes';
//   export default flatRoutes() satisfies RouteConfig;

export default [
  index("routes/home.tsx"),
  route("railyard", "routes/railyard.tsx"),
  route("registry", "routes/registry.tsx"),
  route("template-mod", "routes/template-mod.tsx"),
  route("website", "routes/website.tsx"),
] satisfies RouteConfig;
