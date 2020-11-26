/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { funcdef, typedef, typeinit, bool } from './type'

import { CArray } from './collection'

describe('collection', () => {
	test('CArray', () => {
		const tdesc = typedef({
			arr: CArray,
			out: bool,
		})
		funcdef(
			tdesc,
			'func',
			{
				arr: true,
			},
			(self: any) => {
				self.out = !self.out
			}
		)
		const ret = typeinit(tdesc, { arr: [0], out: true })
		expect(ret.arr).toBeInstanceOf(Array)
		expect(ret.arr).toHaveLength(1)
		expect(ret.out).toBe(true)
		ret.arr[0] = 1
		expect(ret.out).toBe(false)
		ret.arr[1] = 2
		expect(ret.out).toBe(true)
		ret.arr.splice(1, 1)
		expect(ret.arr).toHaveLength(1)
		expect(ret.out).toBe(false)
		ret.arr.splice(0, 0)
		expect(ret.arr).toHaveLength(1)
		expect(ret.out).toBe(true)
		ret.arr.push(1)
		expect(ret.out).toBe(false)
		ret.arr.name = 1
		expect('name' in ret.arr).toBe(true)
		expect(ret.out).toBe(true)
		delete ret.arr.name
		expect('name' in ret.arr).toBe(false)
		expect(ret.out).toBe(false)
		expect(ret.arr).toHaveLength(2)

		ret.arr = void 0
		expect(ret.arr).toBeUndefined()
		ret.arr = null
		expect(ret.arr).toBeNull()

		ret.arr = typeinit(CArray)
		expect(ret.arr).toBeInstanceOf(Array)
	})
})
