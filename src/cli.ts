#!/usr/bin/env node

import commandLineArgs from 'command-line-args'
import moxy from './'

const options = commandLineArgs([
  { name: 'port', alias: 'p', type: Number },
  { name: 'forward', alias: 'f', type: String },
])

const proxy = moxy({
  port: options.port,
  forward: options.forward,
})

proxy.start()
