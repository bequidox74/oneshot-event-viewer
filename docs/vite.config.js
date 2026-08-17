import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: "index.html",
        dump: "dump.html",
      }
    },
  },
  base: process.env.BASE_URL,
});
