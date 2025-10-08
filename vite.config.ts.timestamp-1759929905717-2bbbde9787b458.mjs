// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import removeConsole from "file:///home/project/node_modules/vite-plugin-remove-console/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    // Supprimer les console.log en production uniquement
    removeConsole({
      includes: ["log", "warn"],
      // Supprimer console.log et console.warn
      excludes: ["error"]
      // Conserver console.error pour le débogage critique
    })
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcmVtb3ZlQ29uc29sZSBmcm9tICd2aXRlLXBsdWdpbi1yZW1vdmUtY29uc29sZSc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICAvLyBTdXBwcmltZXIgbGVzIGNvbnNvbGUubG9nIGVuIHByb2R1Y3Rpb24gdW5pcXVlbWVudFxuICAgIHJlbW92ZUNvbnNvbGUoe1xuICAgICAgaW5jbHVkZXM6IFsnbG9nJywgJ3dhcm4nXSwgLy8gU3VwcHJpbWVyIGNvbnNvbGUubG9nIGV0IGNvbnNvbGUud2FyblxuICAgICAgZXhjbHVkZXM6IFsnZXJyb3InXSwgLy8gQ29uc2VydmVyIGNvbnNvbGUuZXJyb3IgcG91ciBsZSBkXHUwMEU5Ym9nYWdlIGNyaXRpcXVlXG4gICAgfSlcbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxtQkFBbUI7QUFHMUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBO0FBQUEsSUFFTixjQUFjO0FBQUEsTUFDWixVQUFVLENBQUMsT0FBTyxNQUFNO0FBQUE7QUFBQSxNQUN4QixVQUFVLENBQUMsT0FBTztBQUFBO0FBQUEsSUFDcEIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
