/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { array, change, typedef } from './type'

const refMap = new WeakMap<unknown[], Set<unknown[]>>()

const syl_raw = Symbol(),
	syl_CArray = Symbol()

const CArrayHandler = {
	get(target: unknown[], key: PropertyKey, receiver: unknown) {
		if (key === syl_raw) {
			return () => target
		}
		return Reflect.get(target, key, receiver)
	},
	set(target: unknown[], key: PropertyKey, value: unknown, receiver: unknown) {
		const ret = Reflect.set(target, key, value, receiver)
		const set = refMap.get(target)
		if (set) {
			for (const v of set) {
				change(v)
			}
		}
		return ret
	},
	deleteProperty(target: unknown[], key: PropertyKey) {
		const ret = Reflect.deleteProperty(target, key)
		const set = refMap.get(target)
		if (set) {
			for (const v of set) {
				change(v)
			}
		}
		return ret
	},
	has(target: unknown[], key: PropertyKey) {
		if (key === syl_CArray) {
			return true
		}
		return Reflect.has(target, key)
	},
}

/**
 * 自动同步元素变更的数组
 *
 * @public
 */
export const CArray = typedef({
	'@name': 'CArray',
	'@type': array,
	'@change': true,
	'@adjust': (self) => {
		if (!self) {
			return self
		}
		if (syl_CArray in self) {
			return self
		}
		return new Proxy(self, CArrayHandler)
	},
	'@assert': (self) => {
		if (self && !(syl_CArray in self)) {
			throw TypeError('expected CArray')
		}
	},
	'@retain': (self) => {
		const raw = (self as unknown as { [syl_raw]: () => unknown[] })[syl_raw]()
		if (!refMap.has(raw)) {
			refMap.set(raw, new Set())
		}
		refMap.get(raw)!.add(self)
	},
	'@release': (self) => {
		const raw = (self as unknown as { [syl_raw]: () => unknown[] })[syl_raw]()
		refMap.get(raw)!.delete(self)
	},
})
