#!/usr/bin/env bun
import { serve } from './server.ts';

const flag = (name: string): string | undefined => {
	const index = Bun.argv.indexOf(`--${name}`);
	return index === -1 ? undefined : Bun.argv[index + 1];
};

const instance = serve({
	port: Number(flag('port') ?? Bun.env.PORT ?? 3000),
	hostname: flag('host'),
	basePath: flag('base-path'),
	maxSize: flag('max-size') ? Number(flag('max-size')) : undefined,
});

console.log(`placeholder-images listening on ${instance.url}`);
console.log(`try ${new URL('hello-world.svg?title=Hello&size=600', instance.url)}`);
