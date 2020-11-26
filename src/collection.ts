/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { typedef, change, TypeDesc } from './type'

import { array } from './builtin'

const refMap = new WeakMap(),
	protoCache = new WeakMap()

const syl_raw = Symbol(),
	syl_CArray = Symbol()

const arrayKeys = {
	push: 1,
	pop: 1,
	shift: 1,
	unshift: 1,
	splice: 1,
	sort: 1,
	reverse: 1,
}
const CArrayHandler = {
	get(target: any, key: string | number | symbol, receiver: any) {
		if (key === syl_raw) {
			return target
		}
		if (key in arrayKeys) {
			const proto = Object.getPrototypeOf(target)
			let p = protoCache.get(proto)
			if (!p) {
				p = {}
				protoCache.set(proto, p)
			}
			if (!p[key]) {
				p[key] = function (...args: any[]) {
					const ret = this[syl_raw][key](...args)
					change(this)
					return ret
				}
			}
			return p[key]
		}
		return Reflect.get(target, key, receiver)
	},
	set(target: any, key: string | number | symbol, value: any, receiver: any) {
		const ret = Reflect.set(target, key, value, receiver)
		change(receiver)
		return ret
	},
	deleteProperty(target: any, key: string | number | symbol) {
		const ret = Reflect.deleteProperty(target, key)
		change(refMap.get(target))
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
export const CArray: TypeDesc = typedef({
	'@name': 'CArray',
	'@type': array,
	'@change': true,
	'@adjust': (self: any) => {
		if (!self) {
			return self
		}
		if (syl_CArray in self) {
			return self
		}
		const ret = new Proxy(self, CArrayHandler)
		refMap.set(self, ret)
		return ret
	},
})
