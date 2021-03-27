import bodyParser from 'body-parser';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server } from 'node:http';

interface MoxyConfig {
    port?: number,
    forward?: string;
};

interface Mock {
    method: string,
    path: string,
    response: {
        status: number,
        headers?: Record<string,string>,
        data: Record<string,unknown>,
    }
};

export default function moxy(config? : MoxyConfig) {
    const forward = config?.forward;
    const port = config?.port ?? 8001;

    const app = express();

    app.use(bodyParser.json());

    const mocks : Mock[] = [];

    function findMock(path : string, method : string) : Mock | null {
        const mock = mocks.find(m => m.path === path && m.method === method.toLowerCase());
        return mock || null;
    }

    app.put(/(\/.+)\/_mocks\/([a-z]+)$/, (req, res) => {
        const mock : Mock = {
            method: req.params[1].toLowerCase(),
            path: req.params[0],
            response: {
                status: req.body.response?.status ?? 200,
                headers: req.body.response?.headers ?? [],
                data: req.body.response?.data ?? null,
            }
        };

        const existing = findMock(mock.path, mock.method);
        if (existing) {
            res.status(409).end();
        }
        else {
            mocks.push(mock);
            res.status(201).end();
        }
    });

    app.use((req, res, next) => {
        const mock = findMock(req.path, req.method);
        if (mock) {
            res.status(mock.response.status);
            res.json(mock.response.data);
        }
        else {
            next();
        }
    });

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