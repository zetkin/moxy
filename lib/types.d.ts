/// <reference types="node" />
import { Server } from 'node:http';
declare global {
    namespace Express {
        interface Request {
            logEntry?: LoggedRequest;
        }
    }
}
export declare const HTTP_METHODS: readonly ["get", "post", "put", "patch", "delete"];
export declare type HTTPMethod = typeof HTTP_METHODS[number];
export declare type HTTPHeaders = Record<string, string | string[] | undefined> | string[][];
export interface Moxy {
    start: () => Server;
    stop: () => Promise<void>;
    mocks: (path?: string) => Mock[];
    log: (path?: string) => Log;
    clearLog: () => void;
    setMock: <G>(path: string, method?: HTTPMethod, response?: MockResponseSetter<G>) => boolean;
    removeMock: (path?: string, method?: HTTPMethod) => void;
}
export interface Mock<ResData = unknown> {
    method: string;
    path: string;
    response: MockResponse<ResData>;
}
export interface MockResponse<ResData = unknown> {
    data: ResData | null;
    headers: HTTPHeaders;
    status: number;
}
export interface MockResponseSetter<ResData = unknown> {
    data?: ResData;
    headers?: HTTPHeaders;
    status?: number;
}
export interface Log<ReqData = unknown, ResData = unknown> {
    log: LoggedRequest<ReqData, ResData>[];
    path?: string;
}
export interface LoggedRequest<ReqData = unknown, ResData = unknown> {
    timestamp: Date;
    method: string;
    path: string;
    headers?: HTTPHeaders;
    data?: ReqData;
    mocked: boolean;
    response: {
        data?: ResData;
        headers?: HTTPHeaders;
        status: number;
    };
}
