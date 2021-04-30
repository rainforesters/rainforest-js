/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { typedef, unknown, TypeDesc } from './type'

/**
 * @public
 */
export const object: TypeDesc<Record<string, unknown>> = typedef({
	'@name': 'object',
	'@type': unknown,
	'@value': () => {
		return {}
	},
	'@verify': (self: unknown) => {
		if (null !== self && void 0 !== self && typeof self !== 'object') {
			throw TypeError('expected object')
		}
	},
})

/**
 * @public
 */
export const array: TypeDesc<unknown[]> = typedef({
	'@name': 'array',
	'@type': unknown,
	'@value': () => [],
	'@verify': (self: unknown) => {
		if (null !== self && void 0 !== self && !Array.isArray(self)) {
			throw TypeError('expected array')
		}
	},
})
