import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server } from 'node:http';

interface MoxyConfig {
    port?: number,
    forward?: string;
};

export default function moxy(config? : MoxyConfig) {
    const forward = config?.forward;
    const port = config?.port ?? 8001;

    const app = express();

    if (forward) {
        app.use(createProxyMiddleware({
            target: forward,
            changeOrigin: true,
        }));
    }

    let server : Server;

    return {
        start: () => {
            server = app.listen(port);
            return server;
        },

        stop: () => {
            server.close();
        }
    };
}