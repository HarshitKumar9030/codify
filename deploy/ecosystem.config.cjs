module.exports = {
  apps: [
    {
      name: 'codify-backend',
      cwd: './codify-execution-server',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'codify-frontend',
      cwd: './codify-frontend',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
