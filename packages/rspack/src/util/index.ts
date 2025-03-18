import type { JsRspackError, JsStatsError } from "@rspack/binding";
import type { LoaderObject } from "../loader-runner";

export function mapValues(
	record: Record<string, string>,
	fn: (key: string) => string
) {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [key, fn(value)])
	);
}

export function isNil(value: unknown): value is null | undefined {
	return value === null || value === undefined;
}

export const toBuffer = (bufLike: string | Buffer): Buffer => {
	if (Buffer.isBuffer(bufLike)) {
		return bufLike;
	}
	if (typeof bufLike === "string") {
		return Buffer.from(bufLike);
	}

	throw new Error("Buffer or string expected");
};

export const toObject = (input: string | Buffer | object): object => {
	let s: string;
	if (Buffer.isBuffer(input)) {
		s = input.toString("utf8");
	} else if (input && typeof input === "object") {
		return input;
	} else if (typeof input === "string") {
		s = input;
	} else {
		throw new Error("Buffer or string or object expected");
	}

	return JSON.parse(s);
};

export function serializeObject(
	map: string | object | undefined | null
): Buffer | undefined {
	if (isNil(map)) {
		return undefined;
	}

	if (typeof map === "string") {
		if (map) {
			return toBuffer(map);
		}
		return undefined;
	}

	return toBuffer(JSON.stringify(map));
}

export function isPromiseLike(value: unknown): value is Promise<any> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as any).then === "function"
	);
}

export function isJsStatsError(err: any): err is JsStatsError {
	return !(err instanceof Error) && err.formatted;
}

export function concatErrorMsgAndStack(
	err: Error | JsRspackError | string
): JsRspackError {
	if (typeof err === "string") {
		return new Error(err);
	}
	const hideStack = "hideStack" in err && err.hideStack;
	if (!hideStack && "stack" in err) {
		// This is intended to be different than webpack,
		// here we want to treat the almost the same as `Error.stack` just without the stack.
		// Webpack uses `Error.message`, however it does not contain the `Error.prototype.name`
		// `xxx` -> `Error: xxx`. So they behave the same even if `hideStack` is set to `true`.
		err.message = err.stack || err.toString();
	} else {
		// This is intended to be different than webpack,
		// here we want to treat the almost the same as `Error.stack` just without the stack.
		// Webpack uses `Error.message`, however it does not contain the `Error.prototype.name`
		// `xxx` -> `Error: xxx`. So they behave the same even if `hideStack` is set to `true`.
		err.message = err.toString();
	}
	// maybe `null`, use `undefined` to compatible with `Option<String>`
	err.stack = err.stack || undefined;

	if ("loc" in err) {
		err.loc = JSON.stringify(err.loc);
	}

	return err;
}

export function indent(str: string, prefix: string) {
	const rem = str.replace(/\n([^\n])/g, `\n${prefix}$1`);
	return prefix + rem;
}

export function stringifyLoaderObject(o: LoaderObject): string {
	return o.path + o.query + o.fragment;
}

export function asArray<T>(item: T[]): T[];
export function asArray<T>(item: readonly T[]): readonly T[];
export function asArray<T>(item: T): T[];
export function asArray<T>(item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item];
}

const getDeprecationStatus = () => {
	const defaultEnableDeprecatedWarning = true;
	if (
		process.env.RSPACK_DEP_WARNINGS === "false" ||
		process.env.RSPACK_DEP_WARNINGS === "0"
	) {
		return false;
	}
	return (
		(process.env.RSPACK_DEP_WARNINGS ?? `${defaultEnableDeprecatedWarning}`) !==
		"false"
	);
};

const yellow = (content: string) =>
	`\u001b[1m\u001b[33m${content}\u001b[39m\u001b[22m`;

export const deprecatedWarn = (
	content: string,
	enable = getDeprecationStatus()
) => {
	if (enable) {
		console.warn(yellow(content));
		console.warn(
			indent(
				"Set env `RSPACK_DEP_WARNINGS` to 'false' to temporarily disable deprecation warnings.\n",
				"    "
			)
		);
	}
};

export const unsupported = (name: string, issue?: string) => {
	let s = `${name} is not supported by rspack.`;
	if (issue) {
		s += ` Please refer to issue ${issue} for more information.`;
	}
	throw new Error(s);
};
