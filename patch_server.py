import re

with open('src/server.js', 'r') as f:
    content = f.read()

content = content.replace("import { mkdirSync } from 'fs';", "import { mkdirSync } from 'fs';\nimport { Server } from 'socket.io';\nimport { startCronJobs } from './services/cron.service.js';")

new_init = """    const port = parseInt(env.PORT, 10);
    const server = app.listen(port, () => {
      logger.info(`🚀 Aura Health API running on port ${port} [${env.NODE_ENV}]`);
    });

    // Initialize Socket.io
    const io = new Server(server, {
      cors: { origin: '*' }
    });
    app.set('io', io); // Make it available to controllers
    
    io.on('connection', (socket) => {
      logger.info('Client connected to realtime socket');
      socket.on('disconnect', () => {});
    });

    // Start Cron Jobs
    startCronJobs();"""

content = re.sub(r'const port = parseInt.*?\}\);', new_init, content, flags=re.DOTALL)

with open('src/server.js', 'w') as f:
    f.write(content)
