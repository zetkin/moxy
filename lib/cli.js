#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_args_1 = __importDefault(require("command-line-args"));
const _1 = __importDefault(require("./"));
const options = command_line_args_1.default([
    { name: 'port', alias: 'p', type: Number },
    { name: 'forward', alias: 'f', type: String },
]);
const proxy = _1.default({
    port: options.port,
    forward: options.forward,
});
proxy.start();
