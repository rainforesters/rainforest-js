/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { typedef, any, TypeDesc } from './type'

/**
 * @public
 */
export const object: TypeDesc = typedef({
	'@name': 'object',
	'@type': any,
	'@value': () => {
		return {}
	},
	'@verify': (self: any) => {
		if (null !== self && void 0 !== self && typeof self !== 'object') {
			throw TypeError('expected object')
		}
	},
})

/**
 * @public
 */
export const array: TypeDesc = typedef({
	'@name': 'array',
	'@type': any,
	'@value': () => [],
	'@verify': (self: any) => {
		if (null !== self && void 0 !== self && !Array.isArray(self)) {
			throw TypeError('expected array')
		}
	},
})
