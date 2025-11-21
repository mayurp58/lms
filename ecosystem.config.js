module.exports = {
  apps: [
    {
      name: "banking-system",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    }
  ]
};
