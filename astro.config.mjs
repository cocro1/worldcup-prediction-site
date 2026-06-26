import path from "node:path";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://cocro1.github.io",
  base: "/worldcup-prediction-site",
  vite: {
    resolve: {
      alias: {
        "./ariaPropsMap": path.resolve("node_modules/aria-query/lib/ariaPropsMap.js"),
        "./domMap": path.resolve("node_modules/aria-query/lib/domMap.js"),
        "./rolesMap": path.resolve("node_modules/aria-query/lib/rolesMap.js"),
        "./elementRoleMap": path.resolve("node_modules/aria-query/lib/elementRoleMap.js"),
        "./roleElementMap": path.resolve("node_modules/aria-query/lib/roleElementMap.js"),
        "./AXObjectElementMap": path.resolve("node_modules/axobject-query/lib/AXObjectElementMap.js"),
        "./AXObjectRoleMap": path.resolve("node_modules/axobject-query/lib/AXObjectRoleMap.js"),
        "./AXObjectsMap": path.resolve("node_modules/axobject-query/lib/AXObjectsMap.js"),
        "./elementAXObjectMap": path.resolve("node_modules/axobject-query/lib/elementAXObjectMap.js"),
      },
    },
  },
});
