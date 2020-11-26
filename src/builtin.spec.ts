/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { typedef, typeinit } from './type'

import { object, array } from './builtin'

describe('builtin', () => {
	test('object', () => {
		const tdesc = typedef({
			value: object,
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBeDefined()
		ret.value = void 0
		expect(ret.value).toBeUndefined()
		ret.value = null
		expect(ret.value).toBeNull()
		ret.value = {}
		expect(ret.value).toBeInstanceOf(Object)
		ret.value = []
		expect(ret.value).toBeInstanceOf(Array)
		;[true, 1, 'test'].forEach((v) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})

	test('array', () => {
		const tdesc = typedef({
			value: array,
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBeDefined()
		ret.value = void 0
		expect(ret.value).toBeUndefined()
		ret.value = null
		expect(ret.value).toBeNull()
		ret.value = []
		expect(ret.value).toBeInstanceOf(Array)
		;[{}, true, 1, 'test'].forEach((v) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})
})
