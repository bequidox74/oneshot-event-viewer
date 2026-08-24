import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: "index.html",
        dump: "dump.html",
        search: "search.html",
      }
    },
  },
  // eslint-disable-next-line no-undef
  base: process.env.BASE_URL,
});
