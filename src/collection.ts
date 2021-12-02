/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { typedef, change, TypeDesc } from './type'

import { array } from './builtin'

const refMap = new WeakMap<any, Set<any>>()

const syl_raw = Symbol(),
	syl_CArray = Symbol()

const CArrayHandler = {
	get(target: any, key: string | number | symbol, receiver: any) {
		if (key === syl_raw) {
			return () => target
		}
		return Reflect.get(target, key, receiver)
	},
	set(target: any, key: string | number | symbol, value: any, receiver: any) {
		const ret = Reflect.set(target, key, value, receiver)
		const set = refMap.get(target)
		if (set) {
			for (const v of set) {
				change(v)
			}
		}
		return ret
	},
	deleteProperty(target: any, key: string | number | symbol) {
		const ret = Reflect.deleteProperty(target, key)
		const set = refMap.get(target)
		if (set) {
			for (const v of set) {
				change(v)
			}
		}
		return ret
	},
	has(target: any, key: string | number | symbol) {
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
export const CArray: TypeDesc<unknown[]> = typedef({
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
		const raw = (<any>self)[syl_raw]()
		if (!refMap.has(raw)) {
			refMap.set(raw, new Set<any>())
		}
		refMap.get(raw)!.add(self)
	},
	'@release': (self) => {
		const raw = (<any>self)[syl_raw]()
		refMap.get(raw)!.delete(self)
	},
})
