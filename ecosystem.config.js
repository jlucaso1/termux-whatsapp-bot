module.exports = {
  apps: [
    {
      script: "index.js",
      watch: ".",
      ignore_watch: ["node_modules", "auth_info.json", "temp"],
      exec_mode: "cluster",
    },
  ],
};
