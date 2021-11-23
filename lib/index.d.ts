/// <reference types="node" />
import { Server } from 'node:http';
declare global {
    namespace Express {
        interface Request {
            logEntry?: LoggedRequest;
        }
    }
}
interface MoxyConfig {
    port?: number;
    forward?: string;
}
declare type HTTPHeaders = Record<string, string | string[] | undefined>;
interface LoggedRequest {
    timestamp: Date;
    method: string;
    path: string;
    headers?: HTTPHeaders;
    data?: Record<string, unknown>;
    mocked: boolean;
    response: {
        status: number;
        headers?: HTTPHeaders;
        data?: Record<string, unknown>;
    };
}
export default function moxy(config?: MoxyConfig): {
    start: () => Server;
    stop: () => void;
};
export {};
