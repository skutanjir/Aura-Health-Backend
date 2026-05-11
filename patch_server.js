const fs = require('fs');
let content = fs.readFileSync('src/server.js', 'utf8');

// Add imports
content = content.replace("import { mkdirSync } from 'fs';", "import { mkdirSync } from 'fs';\nimport { Server } from 'socket.io';\nimport { startCronJobs } from './services/cron.service.js';");

// Add Socket.io init and start Cron
const newInit = `
    const port = parseInt(env.PORT, 10);
    const server = app.listen(port, () => {
      logger.info(\`🚀 Aura Health API running on port \${port} [\${env.NODE_ENV}]\`);
    });

    // Initialize Socket.io
    const io = new Server(server, {
      cors: { origin: '*' }
    });
    app.set('io', io); // Make it available to controllers
    
    io.on('connection', (socket) => {
      logger.info('Client connected to realtime socket');
      socket.on('disconnect', () => {
        logger.info('Client disconnected from realtime socket');
      });
    });

    // Start Cron Jobs
    startCronJobs();
`;

content = content.replace(/const port = parseInt[\s\S]+?\}\);/, newInit);
fs.writeFileSync('src/server.js', content);
