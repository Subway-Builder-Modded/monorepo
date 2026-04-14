import { type RouteConfig, index } from "@react-router/dev/routes";

// Manual route definitions for initial setup.
// Can be switched to file-based routing via @react-router/fs-routes:
//   import { flatRoutes } from '@react-router/fs-routes';
//   export default flatRoutes() satisfies RouteConfig;

export default [index("routes/home.tsx")] satisfies RouteConfig;
