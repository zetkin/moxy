"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const types_1 = require("./types");
const RES_MOCK_REGEX = /(\/.+)\/_mocks\/([a-z]+)$/;
const RES_MOCKS_REGEX = /(\/.+)\/_mocks$/;
function moxy(config) {
    var _a;
    const forward = config === null || config === void 0 ? void 0 : config.forward;
    const port = (_a = config === null || config === void 0 ? void 0 : config.port) !== null && _a !== void 0 ? _a : 8001;
    const app = (0, express_1.default)();
    let server;
    let mocks = [];
    let requestLog = [];
    function findMock(path, method) {
        const mock = mocks.find((m) => m.path === path && m.method === method.toLowerCase());
        return mock || null;
    }
    app.use(body_parser_1.default.json());
    app.use((0, cors_1.default)());
    app.get('/_log', (req, res) => {
        res.json(moxyApi.log());
    });
    app.get(/(\/.+)\/_log$/, (req, res) => {
        const path = req.params[0];
        res.json(moxyApi.log(path));
    });
    app.delete('/_log', (req, res) => {
        moxyApi.clearLog();
        res.status(204).end();
    });
    app.put(RES_MOCK_REGEX, (req, res) => {
        const method = req.params[1].toLowerCase();
        const path = req.params[0];
        // Validate method
        if (!types_1.HTTP_METHODS.includes(method)) {
            res.status(400).json({ error: 'Invalid method' });
        }
        const existing = moxyApi.setMock(path, method, req.body.response);
        if (existing) {
            // If mock overwritten, return 204
            res.status(204).end();
        }
        else {
            // If new mock, return 201
            res.status(201).end();
        }
    });
    // Delete single path-method mock
    app.delete(RES_MOCK_REGEX, (req, res) => {
        moxyApi.removeMock(req.params[0], req.params[1]);
        res.status(204).end();
    });
    // Delete all mocks from a path
    app.delete(RES_MOCKS_REGEX, (req, res) => {
        moxyApi.removeMock(req.params[0]);
        res.status(204).end();
    });
    // Delete all mocks
    app.delete('/_mocks', (req, res) => {
        moxyApi.removeMock();
        res.status(204).end();
    });
    // Create logEntry and attach to request
    app.use((req, res, next) => {
        req.logEntry = {
            timestamp: new Date(),
            method: req.method,
            path: req.path,
            mocked: false,
            headers: {},
            response: {
                status: 0,
                headers: {},
            },
        };
        requestLog.push(req.logEntry);
        if (Object.keys(req.body).length) {
            req.logEntry.data = req.body;
        }
        next();
    });
    app.use((req, res, next) => {
        const mock = findMock(req.path, req.method);
        if (mock) {
            if (req.logEntry) {
                req.logEntry.mocked = true;
                req.logEntry.response.status = mock.response.status;
                req.logEntry.response.data = mock.response.data;
            }
            res.status(mock.response.status);
            res.json(mock.response.data);
        }
        else {
            next();
        }
    });
    if (forward) {
        app.use((0, http_proxy_middleware_1.createProxyMiddleware)({
            target: forward,
            changeOrigin: true,
            logLevel: 'error',
            onProxyReq: http_proxy_middleware_1.fixRequestBody,
            onProxyRes: (proxyRes, req, res) => {
                var _a;
                const logEntry = req.logEntry;
                if (logEntry) {
                    logEntry.response.status = proxyRes.statusCode;
                    logEntry.response.headers = proxyRes.headers;
                    if ((_a = proxyRes.headers['content-type']) === null || _a === void 0 ? void 0 : _a.startsWith('application/json')) {
                        let data = '';
                        proxyRes.on('data', (chunk) => {
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
                }
            },
        }));
    }
    const moxyApi = {
        start: () => {
            server = app.listen(port);
            return server;
        },
        stop: () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                server.close(() => resolve());
            });
        }),
        mocks: (path) => {
            return path ? mocks.filter((mock) => mock.path === path) : mocks;
        },
        log: (path) => {
            if (path) {
                return {
                    path,
                    log: requestLog.filter((entry) => entry.path === path),
                };
            }
            return { log: requestLog };
        },
        clearLog: () => {
            requestLog = [];
        },
        setMock: (path, method = 'get', response = {}) => {
            var _a, _b, _c;
            const existingMock = findMock(path, method);
            if (existingMock) {
                // Remove existing mock
                mocks = mocks.filter((m) => m !== existingMock);
            }
            // Add new mock
            mocks.push({
                method,
                path,
                response: {
                    status: (_a = response.status) !== null && _a !== void 0 ? _a : 200,
                    headers: (_b = response.headers) !== null && _b !== void 0 ? _b : [],
                    data: (_c = response.data) !== null && _c !== void 0 ? _c : null,
                },
            });
            return Boolean(existingMock);
        },
        removeMock: (path, method) => {
            if (path && method) {
                const existingMock = findMock(path, method);
                mocks = mocks.filter((mock) => mock !== existingMock);
            }
            else if (path) {
                mocks = mocks.filter((mock) => mock.path !== path);
            }
            else {
                mocks = [];
            }
        },
    };
    return moxyApi;
}
exports.default = moxy;
