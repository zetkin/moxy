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

const RES_MOCK_REGEX = /(\/.+)\/_mocks\/([a-z]+)$/;
const RES_MOCKS_REGEX = /(\/.+)\/_mocks$/;

export default function moxy(config? : MoxyConfig) {
    const forward = config?.forward;
    const port = config?.port ?? 8001;

    const app = express();

    app.use(bodyParser.json());

    let mocks : Mock[] = [];

    function findMock(path : string, method : string) : Mock | null {
        const mock = mocks.find(m => m.path === path && m.method === method.toLowerCase());
        return mock || null;
    }

    app.put(RES_MOCK_REGEX, (req, res) => {
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

    // Delete single path-method mock
    app.delete(RES_MOCK_REGEX, (req, res) => {
        const existing = findMock(req.params[0], req.params[1]);
        if (existing) {
            mocks = mocks.filter(m => m !== existing);
            res.status(204).end();
        }
        else {
            res.status(404).end();
        }
    });

    // Delete all mocks from a path
    app.delete(RES_MOCKS_REGEX, (req, res) => {
        mocks = mocks.filter(m => m.path !== req.path);
        res.status(204).end();
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