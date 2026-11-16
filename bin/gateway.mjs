#!/usr/bin/env node
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {SimulationBackend} from '../src/backend.mjs';
import {createGateway} from '../src/server.mjs';

const backend = new SimulationBackend({
  ...(process.env.BACKBOND_SIMULATION_BASE_URL ? {base: process.env.BACKBOND_SIMULATION_BASE_URL} : {}),
  allowLoopback: process.env.BACKBOND_ALLOW_LOOPBACK_TEST === '1'
});
serveStdio(() => createGateway(backend));
