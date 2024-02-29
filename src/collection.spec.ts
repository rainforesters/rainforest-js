/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	array,
	bool,
	int32,
	ruledef,
	typedef,
	typeinit,
	type TypeDesc,
} from './type'

import { CArray } from './collection'

describe('collection', () => {
	test('CArray', () => {
		const tdesc = typedef({
			arr: CArray as TypeDesc<array<TypeDesc<int32>>>,
			hash: int32,
			out: bool,
		})
		ruledef(
			tdesc,
			'rule',
			{
				arr: true,
			},
			(self) => {
				if (self.arr) {
					let hash = 5381
					for (const v of self.arr) {
						hash += (hash << 5) + v
					}
					self.hash = hash | 0
				} else {
					self.hash = 0
				}
				self.out = !self.out
			}
		)

		const arr = typeinit(CArray as TypeDesc<array<TypeDesc<int32>>>)
		arr[0] = 1
		delete arr[1]

		const ret = typeinit(tdesc, { arr: [0] })
		expect(ret.arr).toBeInstanceOf(Array)
		expect(ret.arr).toHaveLength(1)
		expect(ret.hash).toBe(0)
		ret.arr = arr
		expect(ret.arr).toBeInstanceOf(Array)
		expect(ret.arr).toHaveLength(1)
		expect(ret.hash).toBe(177574)
		ret.arr.length = 0
		expect(ret.hash).toBe(5381)
		ret.arr[0] = 1
		expect(ret.hash).toBe(177574)
		ret.arr[1] = 2
		expect(ret.hash).toBe(5859944)
		ret.arr.splice(1, 1)
		expect(ret.arr).toHaveLength(1)
		expect(ret.hash).toBe(177574)
		ret.arr.splice(0, 0)
		expect(ret.arr).toHaveLength(1)
		expect(ret.hash).toBe(177574)
		ret.arr.push(2)
		expect(ret.hash).toBe(5859944)
		ret.out = false
		;(ret.arr as any).name = 1
		expect('name' in ret.arr).toBe(true)
		expect(ret.out).toBe(true)
		delete (ret.arr as any).name
		expect('name' in ret.arr).toBe(false)
		expect(ret.out).toBe(false)
		expect(ret.arr).toHaveLength(2)

		ret.arr = (void 0)!
		expect(ret.arr).toBeUndefined()
		expect(ret.hash).toBe(0)
		ret.arr = null!
		expect(ret.arr).toBeNull()
		expect(ret.hash).toBe(0)

		arr.length = 0
		arr[0] = 1
		expect(ret.hash).toBe(0)
		ret.arr = arr
		expect(ret.hash).toBe(177574)
		arr.length = 0
		expect(ret.hash).toBe(5381)

		const a = typeinit(tdesc, { arr: new Proxy(arr, {}) })
		const b = typeinit(tdesc, { arr: new Proxy(a.arr, {}) })
		expect(ret.arr).toBe(arr)
		expect(a.arr).not.toBe(arr)
		expect(b.arr).not.toBe(arr)
		expect(b.arr).not.toBe(a.arr)
		expect(a.hash).toBe(0)
		expect(b.hash).toBe(0)
		a.arr[0] = 1
		expect(ret.hash).toBe(177574)
		expect(a.hash).toBe(177574)
		expect(b.hash).toBe(177574)
		b.arr.push(2)
		expect(ret.hash).toBe(5859944)
		expect(a.hash).toBe(5859944)
		expect(b.hash).toBe(5859944)
		arr.length = 0
		expect(ret.hash).toBe(5381)
		expect(a.hash).toBe(5381)
		expect(b.hash).toBe(5381)
		arr[0] = 1
		expect(ret.hash).toBe(177574)
		expect(a.hash).toBe(177574)
		expect(b.hash).toBe(177574)
		arr.push(2)
		expect(ret.hash).toBe(5859944)
		expect(a.hash).toBe(5859944)
		expect(b.hash).toBe(5859944)
		ret.arr = null!
		expect(ret.arr).toBeNull()
		expect(ret.hash).toBe(0)
		arr.length = 0
		expect(ret.hash).toBe(0)
		expect(a.hash).toBe(5381)
		expect(b.hash).toBe(5381)
	})

	test('decorate CArray', () => {
		const tdesc = typedef({
			test: typedef({
				'@type': CArray,
				'@adjust': () => [],
			}),
		})
		expect(() => {
			typeinit(tdesc)
		}).toThrow(/test/)
	})
})
