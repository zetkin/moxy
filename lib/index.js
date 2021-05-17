"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
;
;
;
const RES_MOCK_REGEX = /(\/.+)\/_mocks\/([a-z]+)$/;
const RES_MOCKS_REGEX = /(\/.+)\/_mocks$/;
function moxy(config) {
    var _a;
    const forward = config === null || config === void 0 ? void 0 : config.forward;
    const port = (_a = config === null || config === void 0 ? void 0 : config.port) !== null && _a !== void 0 ? _a : 8001;
    const app = express_1.default();
    app.use(body_parser_1.default.json());
    app.use(cors_1.default());
    let mocks = [];
    let requestLog = [];
    function findMock(path, method) {
        const mock = mocks.find(m => m.path === path && m.method === method.toLowerCase());
        return mock || null;
    }
    app.get('/_log', (req, res) => {
        res.json({ log: requestLog });
    });
    app.get(/(\/.+)\/_log$/, (req, res) => {
        const path = req.params[0];
        res.json({
            path,
            log: requestLog.filter(entry => entry.path === path),
        });
    });
    app.delete('/_log', (req, res) => {
        requestLog = [];
        res.status(204).end();
    });
    app.put(RES_MOCK_REGEX, (req, res) => {
        var _a, _b, _c, _d, _e, _f;
        const mock = {
            method: req.params[1].toLowerCase(),
            path: req.params[0],
            response: {
                status: (_b = (_a = req.body.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 200,
                headers: (_d = (_c = req.body.response) === null || _c === void 0 ? void 0 : _c.headers) !== null && _d !== void 0 ? _d : [],
                data: (_f = (_e = req.body.response) === null || _e === void 0 ? void 0 : _e.data) !== null && _f !== void 0 ? _f : null,
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
    // Delete all mocks
    app.delete('/_mocks', (req, res) => {
        mocks = [];
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
        app.use(http_proxy_middleware_1.createProxyMiddleware({
            target: forward,
            changeOrigin: true,
            onProxyReq: http_proxy_middleware_1.fixRequestBody,
            onProxyRes: (proxyRes, req, res) => {
                var _a;
                const logEntry = {
                    timestamp: new Date(),
                    method: req.method,
                    path: req.path,
                    headers: req.headers,
                    response: {
                        status: proxyRes.statusCode,
                        headers: proxyRes.headers,
                    }
                };
                if ((_a = proxyRes.headers['content-type']) === null || _a === void 0 ? void 0 : _a.startsWith('application/json')) {
                    let data = '';
                    proxyRes.on('data', chunk => {
                        data += chunk;
                    });
                    proxyRes.on('end', () => {
                        try {
                            logEntry.response.data = JSON.parse(data);
                        }
                        catch (err) {
                            // Do nothing
                        }
                    });
                }
                requestLog.push(logEntry);
            },
        }));
    }
    let server;
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
exports.default = moxy;
