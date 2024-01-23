import Redis from 'ioredis';
const host = process.env.REDIS_HOST;
const portString = process.env.REDIS_PORT;
const portNumber = parseInt(portString!);

export const redisDb = new Redis({
    host,
    port: portNumber
});