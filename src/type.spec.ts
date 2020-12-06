/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	wrapval,
	funcdef,
	typedef,
	typeinit,
	structbody,
	structof,
	outcome,
	change,
	bool,
	int32,
	float64,
	string,
	any,
} from './type'

const at_mock = wrapval({ '@mock': true })

describe('type', () => {
	test('define a struct', () => {
		const tdesc = typedef({
			name: string,
			sex: bool,
			age: int32,
			trend: float64,
		})
		expect(tdesc).toBeInstanceOf(Object)
		const body = structbody(tdesc)
		expect(body.name).toBe(string)
		expect(body.sex).toBe(bool)
		expect(body.age).toBe(int32)
		expect(body.trend).toBe(float64)
	})

	test('define an empty struct', () => {
		const tdesc = typedef({})
		expect(tdesc).toBeInstanceOf(Object)
		expect(Object.keys(structbody(tdesc)).length).toBe(0)
	})

	test('declare an empty struct before, then complete its fields', () => {
		const tdesc = typedef({})
		typedef(
			{
				next: tdesc,
			},
			tdesc
		)
		expect(structbody(tdesc).next).toBe(tdesc)
	})

	test('cannot redefine an empty struct if it has been used', () => {
		const tdesc = typedef({})
		typeinit(tdesc)
		expect(() => {
			typedef(
				{
					next: tdesc,
				},
				tdesc
			)
		}).toThrow()
	})

	test('define new type with invalid description', () => {
		;[
			void 0,
			null,
			{ name: String },
			{ '-name': string },
			{ '1': string },
		].forEach((v) => {
			expect(() => {
				typedef(v)
			}).toThrow()
		})
	})

	test('define new type with a wrong type', () => {
		;[bool, int32, float64, string, any, true, 1, 'test', {}].forEach((v) => {
			expect(() => {
				typedef(
					{},
					typedef({
						'@type': v,
					})
				)
			}).toThrow()
		})
		expect(() => {
			typedef({}, <any>{})
		}).toThrow()
	})

	test('define new type with invalid name', () => {
		;[
			{
				'@name': 1,
			},
			{
				'@name': '_name',
			},
		].forEach((v) => {
			expect(() => {
				typedef(v)
			}).toThrow()
		})
	})

	test('cannot redefine a struct if it has fields', () => {
		const tdesc = typedef({
			name: string,
		})
		expect(() => {
			typedef(
				{
					next: tdesc,
				},
				tdesc
			)
		}).toThrow()
	})

	test('define new type with invalid functions', () => {
		;[
			'@mock',
			'@value',
			'@verify',
			'@adjust',
			'@init',
			'@retain',
			'@release',
		].forEach((k) => {
			expect(() => {
				typedef({
					[k]: {},
				})
			}).toThrow()
		})
	})

	test('get body of struct with wrong type', () => {
		;[
			true,
			1,
			'test',
			{},
			typedef({
				'@type': any,
			}),
		].forEach((v: any) => {
			expect(() => {
				structbody(v)
			}).toThrow()
		})
	})

	test('initialize with wrong type', () => {
		;[true, 1, 'test', {}].forEach((v: any) => {
			expect(() => {
				typeinit(v)
			}).toThrow()
		})
	})

	test('decorate bool', () => {
		const tdesc = typedef({
			'@type': bool,
		})
		expect(tdesc).toBeInstanceOf(Object)
		expect(typeinit(tdesc)).toBe(false)
	})

	test('decorate int32', () => {
		const tdesc = typedef({
			'@type': int32,
		})
		expect(tdesc).toBeInstanceOf(Object)
		expect(typeinit(tdesc)).toBe(0)
	})

	test('decorate float64', () => {
		const tdesc = typedef({
			'@type': float64,
		})
		expect(tdesc).toBeInstanceOf(Object)
		expect(typeinit(tdesc)).toBe(0)
	})

	test('decorate string', () => {
		const tdesc = typedef({
			'@type': string,
		})
		expect(tdesc).toBeInstanceOf(Object)
		expect(typeinit(tdesc)).toBe('')
	})

	test('decorate any', () => {
		const tdesc = typedef({
			'@type': any,
		})
		expect(tdesc).toBeInstanceOf(Object)
		expect(typeinit(tdesc)).toBeUndefined()
	})

	test('decorate struct', () => {
		const A = typedef({
			name: string,
		})
		const tdesc = typedef({
			'@type': A,
		})
		expect(tdesc).toBeInstanceOf(Object)
		expect(tdesc).not.toBe(A)
		expect(structbody(tdesc)).toBe(structbody(A))
		expect(typeinit(tdesc)).toStrictEqual(typeinit(A))
	})

	test('get the type of structure instance', () => {
		const A = typedef({
			name: string,
		})
		const B = typedef({
			'@type': A,
		})
		const a = typeinit(A)
		expect(structof(a)).toBe(A)
		const b = typeinit(B)
		expect(structof(b)).toBe(B)
		;[true, 1, 'test', {}, A].forEach((v: any) => {
			expect(() => {
				structof(v)
			}).toThrow()
		})
	})

	test('mock bool', () => {
		expect(typeof typeinit(bool, at_mock) === 'boolean').toBe(true)
	})

	test('mock int32', () => {
		const ret = typeinit(int32, at_mock)
		expect(ret === (ret | 0)).toBe(true)
	})

	test('mock float64', () => {
		expect(typeof typeinit(float64, at_mock) === 'number').toBe(true)
	})

	test('mock string', () => {
		expect(typeinit(string, at_mock)).not.toBe('')
	})

	test('mock bool use decorate', () => {
		const tdesc = typedef({
			'@type': bool,
			'@mock': () => true,
		})
		expect(typeinit(tdesc, at_mock)).toBe(true)
		expect(typeinit(tdesc)).toBe(false)
	})

	test('mock int32 use decorate', () => {
		const tdesc = typedef({
			'@type': int32,
			'@mock': () => 123,
		})
		expect(typeinit(tdesc, at_mock)).toBe(123)
		expect(typeinit(tdesc)).toBe(0)
	})

	test('mock float64 use decorate', () => {
		const tdesc = typedef({
			'@type': float64,
			'@mock': () => 0.123,
		})
		expect(typeinit(tdesc, at_mock)).toBe(0.123)
		expect(typeinit(tdesc)).toBe(0)
	})

	test('mock string use decorate', () => {
		const tdesc = typedef({
			'@type': string,
			'@mock': () => 'test',
		})
		expect(typeinit(tdesc, at_mock)).toBe('test')
		expect(typeinit(tdesc)).toBe('')
	})

	test('initialize struct', () => {
		const tdesc = typedef({
			name: string,
			sex: bool,
			age: int32,
			trend: float64,
		})
		const ret = typeinit(tdesc)
		expect(ret.name).toBe('')
		expect(ret.sex).toBe(false)
		expect(ret.age).toBe(0)
		expect(ret.trend).toBe(0)
	})

	test('mock struct', () => {
		const tdesc = typedef({
			name: string,
			sex: bool,
			age: int32,
			trend: float64,
		})
		const ret = typeinit(tdesc, at_mock)
		expect(ret.name).not.toBe('')
		expect(typeof ret.sex === 'boolean').toBe(true)
		expect(ret.age === (ret.age | 0)).toBe(true)
		expect(typeof ret.trend === 'number').toBe(true)
	})

	test('mock struct fields', () => {
		const tdesc = typedef({
			name: typedef({
				'@type': string,
				'@mock': () => 'test',
			}),
			sex: typedef({
				'@type': bool,
				'@mock': () => true,
			}),
			age: typedef({
				'@type': int32,
				'@mock': () => 123,
			}),
			trend: typedef({
				'@type': float64,
				'@mock': () => 0.123,
			}),
		})
		const ret = typeinit(tdesc, at_mock)
		expect(ret.name).toBe('test')
		expect(ret.sex).toBe(true)
		expect(ret.age).toBe(123)
		expect(ret.trend).toBe(0.123)
	})

	test('initialize bool with default value', () => {
		const tdesc = typedef({
			'@type': bool,
			'@value': () => true,
		})
		expect(typeinit(tdesc)).toBe(true)
	})

	test('initialize int32 with default value', () => {
		const tdesc = typedef({
			'@type': int32,
			'@value': () => 123,
		})
		expect(typeinit(tdesc)).toBe(123)
	})

	test('initialize float64 with default value', () => {
		const tdesc = typedef({
			'@type': float64,
			'@value': () => 0.123,
		})
		expect(typeinit(tdesc)).toBe(0.123)
	})

	test('initialize string with default value', () => {
		const tdesc = typedef({
			'@type': string,
			'@value': () => 'test',
		})
		expect(typeinit(tdesc)).toBe('test')
	})

	test('initialize struct with default fields value', () => {
		const tdesc = typedef({
			name: typedef({
				'@type': string,
				'@value': () => 'test',
			}),
			sex: typedef({
				'@type': bool,
				'@value': () => true,
			}),
			age: typedef({
				'@type': int32,
				'@value': () => 123,
			}),
			trend: typedef({
				'@type': float64,
				'@value': () => 0.123,
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.name).toBe('test')
		expect(ret.sex).toBe(true)
		expect(ret.age).toBe(123)
		expect(ret.trend).toBe(0.123)
	})

	test('initialize struct with substructure', () => {
		const tdesc = typedef({
			sub: typedef({
				name: string,
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.sub.name).toBe('')
	})

	test('mock struct with substructure', () => {
		const tdesc = typedef({
			sub: typedef({
				name: string,
			}),
		})
		const ret = typeinit(tdesc, at_mock)
		expect(ret.sub.name).not.toBe('')
	})

	test('initialize struct, but will form a circular reference', () => {
		const tdesc = typedef({})
		typedef(
			{
				name: string,
				next: tdesc,
			},
			tdesc
		)
		const ret = typeinit(tdesc)
		expect(ret.name).toBe('')
		expect(ret.next).toBeUndefined()

		const A = typedef({
			'@notnil': true,
		})
		const B = typedef({})
		typedef(
			{
				b: B,
				next: A,
			},
			A
		)
		typedef(
			{
				a: typedef({
					'@type': A,
					'@notnil': true,
				}),
			},
			B
		)
		expect(typeinit(A).next).toBeUndefined()
	})

	test('assign struct with wrong type', () => {
		const A = typedef({})
		const B = typedef({})
		const C = typedef({
			'@type': B,
		})
		const tdesc = typedef({
			b: B,
			value: C,
		})
		const ret = typeinit(tdesc)
		ret.b = typeinit(B)
		ret.b = typeinit(C)
		ret.value = typeinit(C)
		expect(() => {
			ret.b = typeinit(A)
		}).toThrow()
		;[typeinit(A), typeinit(B), true, 1, 'test', {}].forEach((v) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})

	test('assign bool with wrong type', () => {
		const tdesc = typedef({
			value: bool,
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(false)
		ret.value = true
		expect(ret.value).toBe(true)
		;[1, 'test', {}].forEach((v) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})

	test('assign int32 with wrong type', () => {
		const tdesc = typedef({
			value: int32,
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(0)
		ret.value = 123
		expect(ret.value).toBe(123)
		;[true, 0.123, 'test', {}].forEach((v) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})

	test('assign float64 with wrong type', () => {
		const tdesc = typedef({
			value: float64,
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(0)
		ret.value = 0.123
		expect(ret.value).toBe(0.123)
		;[true, 'test', {}].forEach((v) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})

	test('assign string with wrong type', () => {
		const tdesc = typedef({
			value: string,
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe('')
		ret.value = 'test'
		expect(ret.value).toBe('test')
		;[true, 1, {}].forEach((v) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})

	test('verify bool', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': bool,
				'@verify': (self: boolean) => {
					if (self) {
						throw Error('the value must be false')
					}
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(false)
		ret.value = false
		expect(() => {
			ret.value = true
		}).toThrow()
	})

	test('verify int32', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': int32,
				'@verify': (self: number) => {
					if (self >= 3) {
						throw Error('the value must be less than 3')
					}
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(0)
		ret.value = 0
		ret.value = 1
		ret.value = 2
		expect(() => {
			ret.value = 3
		}).toThrow()
	})

	test('verify float64', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': float64,
				'@verify': (self: number) => {
					if (self >= 1) {
						throw Error('the value must be less than 1')
					}
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(0)
		ret.value = 0.123
		expect(() => {
			ret.value = 1
		}).toThrow()
	})

	test('verify string', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': string,
				'@verify': (self: string) => {
					if (self === 'test') {
						throw Error('the value must not be test')
					}
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe('')
		ret.value = 'mock'
		expect(() => {
			ret.value = 'test'
		}).toThrow()
	})

	test('adjust bool', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': bool,
				'@adjust': (self: boolean) => {
					return !self
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(true)
		let tmp = ret.value
		ret.value = tmp
		expect(ret.value).toBe(false)
		tmp = ret.value
		ret.value = tmp
		expect(ret.value).toBe(true)
	})

	test('adjust int32', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': int32,
				'@adjust': (self: number) => {
					return self * 2
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(0)
		ret.value = 1
		expect(ret.value).toBe(2)
		ret.value = 2
		expect(ret.value).toBe(4)
	})

	test('adjust float64', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': float64,
				'@adjust': (self: number) => {
					return self * 2
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe(0)
		ret.value = 0.1
		expect(ret.value).toBe(0.2)
		ret.value = 0.2
		expect(ret.value).toBe(0.4)
	})

	test('adjust string', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': string,
				'@adjust': (self: string) => {
					return self || 'adjust'
				},
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value).toBe('adjust')
		ret.value = 'test'
		expect(ret.value).toBe('test')
		ret.value = ''
		expect(ret.value).toBe('adjust')
	})

	test('adjust struct', () => {
		const tdesc = typedef({
			value: typedef({
				'@adjust': (self: any) => {
					if (!self.name) {
						self.name = 'adjust'
					}
					return self
				},
				name: string,
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.value.name).toBe('adjust')
		ret.value.name = 'test'
		expect(ret.value.name).toBe('test')
		ret.value.name = ''
		expect(ret.value.name).toBe('')
		ret.value = typeinit(tdesc).value
		expect(ret.value.name).toBe('adjust')
	})

	test('lifecycle init', () => {
		expect.assertions(3)
		const tdesc = typedef({
			'@init': (self: any) => {
				expect(self.name).toBe('')
				self.name = 'init'
			},
			name: string,
		})
		const ret = typeinit(tdesc)
		expect(ret.name).toBe('init')
		ret.name = 'test'
		expect(ret.name).toBe('test')
	})

	test('retain reference', () => {
		const Ref = typedef({
			'@retain': (self: any) => {
				self.count++
			},
			count: int32,
		})
		const tdesc = typedef({
			value: Ref,
		})
		const a = typeinit(tdesc)
		const ref = a.value
		expect(ref.count).toBe(1)
		const b = typeinit(tdesc)
		expect(b.value.count).toBe(1)
		b.value = ref
		expect(ref.count).toBe(2)
	})

	test('release reference', () => {
		const Ref = typedef({
			'@retain': (self: any) => {
				self.count++
			},
			'@release': (self: any) => {
				self.count--
			},
			count: int32,
		})
		const tdesc = typedef({
			value: Ref,
		})
		const a = typeinit(tdesc)
		const ref = a.value
		expect(ref.count).toBe(1)
		const b = typeinit(tdesc)
		expect(b.value.count).toBe(1)
		b.value = ref
		expect(ref.count).toBe(2)
		b.value = null
		expect(ref.count).toBe(1)
		a.value = null
		expect(ref.count).toBe(0)
	})

	test('notnil', () => {
		const A = typedef({
			'@notnil': true,
			name: string,
		})
		const B = typedef({
			name: string,
		})
		const tdesc = typedef({
			a: A,
			b: B,
			c: typedef({
				'@type': B,
				'@notnil': true,
			}),
		})
		const ret = typeinit(tdesc)
		expect(ret.a).not.toBeNull()
		const a = ret.a
		a.name = 'a'
		expect(a.name).toBe('a')
		expect(() => {
			ret.a = null
		}).toThrow()
		expect(ret.a).not.toBeNull()
		ret.a = typeinit(A)
		ret.a.name = 'test'
		expect(ret.a).not.toBeNull()
		expect(ret.a.name).toBe('test')
		expect(a.name).toBe('a')
		expect(ret.b).not.toBeNull()
		ret.b = null
		expect(ret.b).toBeNull()
		expect(ret.c).not.toBeNull()
		expect(() => {
			ret.c = null
		}).toThrow()
		expect(ret.c).not.toBeNull()
	})

	test('noinit', () => {
		const A = typedef({
			'@noinit': true,
			name: string,
		})
		const B = typedef({
			name: string,
		})
		const tdesc = typedef({
			a: A,
			b: B,
		})
		const ret = typeinit(tdesc)
		expect(ret.a).toBeUndefined()
		ret.a = typeinit(A)
		expect(ret.a).not.toBeNull()
		ret.a = null
		expect(ret.a).toBeNull()
		expect(ret.b).not.toBeNull()
		ret.b = null
		expect(ret.b).toBeNull()
		expect(typeinit(A)).toBeDefined()
	})

	test('define a function', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			arg3: int32,
			out: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self: any) => {
				self.out = `${self.arg1}-${self.arg2}-${self.arg3}`
			}
		)
		const ret = typeinit(tdesc)
		expect(ret.out).toBe('')
		ret.arg1 = 1
		expect(ret.out).toBe('')
		ret.arg2 = 2
		expect(ret.out).toBe('')
		ret.arg3 = 3
		expect(ret.out).toBe('1-2-3')
	})

	test('define two functions', () => {
		const A = typedef({
			arg1: int32,
			arg2: int32,
			arg3: int32,
			out: string,
			param1: string,
			param2: string,
			param3: string,
			result: string,
		})
		funcdef(
			A,
			'func',
			{
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self: any) => self
		)

		const tdesc = typedef({
			'@type': A,
		})
		funcdef(
			tdesc,
			'func2',
			{
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self: any) => {
				self.out = `${self.arg1}-${self.arg2}-${self.arg3}`
			}
		)
		funcdef(
			tdesc,
			'func3',
			{
				param1: true,
				param2: true,
				param3: true,
			},
			(self: any) => {
				self.result = `${self.param1}-${self.param2}-${self.param3}`
			}
		)
		const ret = typeinit(tdesc)
		expect(ret.out).toBe('')
		ret.arg1 = 1
		expect(ret.out).toBe('')
		ret.arg2 = 2
		expect(ret.out).toBe('')
		ret.arg3 = 3
		expect(ret.out).toBe('1-2-3')
		expect(ret.result).toBe('')
		ret.param1 = 'a'
		expect(ret.result).toBe('')
		ret.param2 = 'b'
		expect(ret.result).toBe('')
		ret.param3 = 'c'
		expect(ret.result).toBe('a-b-c')
	})

	test('define a function on substructure', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			sub: typedef({
				param1: string,
				param2: string,
			}),
			out: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				arg1: true,
				arg2: true,
				sub: {
					param1: true,
					param2: true,
				},
			},
			(self: any) => {
				self.out = `${self.arg1}-${self.arg2} {${self.sub.param1}-${self.sub.param2}}`
			}
		)
		const ret = typeinit(tdesc)
		expect(ret.out).toBe('')
		ret.arg1 = 1
		expect(ret.out).toBe('')
		ret.arg2 = 2
		expect(ret.out).toBe('')
		ret.sub.param1 = 'a'
		expect(ret.out).toBe('')
		ret.sub.param2 = 'b'
		expect(ret.out).toBe('1-2 {a-b}')
	})

	test('the function is executed when the parameters are different', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			out: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				arg1: { '@diff': true },
				arg2: { '@diff': true },
			},
			(self: any) => {
				self.out = `${self.arg1}-${self.arg2}`
			}
		)
		const ret = typeinit(tdesc)
		expect(ret.out).toBe('')
		ret.arg1 = 1
		expect(ret.out).toBe('')
		ret.arg2 = 2
		expect(ret.out).toBe('1-2')
		ret.out = ''
		ret.arg1 = 1
		expect(ret.out).toBe('')
		ret.arg2 = 2
		expect(ret.out).toBe('')
		ret.arg1 = 10
		expect(ret.out).toBe('')
		ret.arg2 = 20
		expect(ret.out).toBe('10-20')
	})

	test('define a function use logical OR', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			arg3: int32,
			out: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				'@or': true,
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self: any) => {
				self.out = `${self.arg1}-${self.arg2}-${self.arg3}`
			}
		)
		const ret = typeinit(tdesc)
		expect(ret.out).toBe('')
		ret.arg1 = 1
		expect(ret.out).toBe('1-0-0')
		ret.arg2 = 2
		expect(ret.out).toBe('1-2-0')
		ret.arg3 = 3
		expect(ret.out).toBe('1-2-3')
	})

	test('define a function on a decorated struct', () => {
		const tdesc = typedef({
			'@type': typedef({
				input: string,
			}),
		})
		funcdef(
			tdesc,
			'func',
			{
				input: true,
			},
			(self: any) => self
		)
	})

	test('define a function with unexpected arguments', () => {
		const tdesc = typedef({
			input: string,
		})
		expect(() => {
			funcdef(tdesc, 'func', null, (self: any) => self)
		}).toThrow()
		expect(() => {
			funcdef(
				tdesc,
				'func',
				{
					input: true,
				},
				null!
			)
		}).toThrow()

		expect(() => {
			funcdef(<any>1, '', null, null!)
		}).toThrow()
		expect(() => {
			funcdef(any, '', null, null!)
		}).toThrow()
	})

	test('duplicate function', () => {
		const tdesc = typedef({
			input: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				input: true,
			},
			(self: any) => self
		)
		expect(() => {
			funcdef(
				tdesc,
				'func',
				{
					input: true,
				},
				(self: any) => self
			)
		}).toThrow()
	})

	test('duplicate function on a decorated struct', () => {
		const A = typedef({
			input: string,
		})
		funcdef(
			A,
			'func',
			{
				input: true,
			},
			(self: any) => self
		)
		expect(() => {
			funcdef(
				A,
				'func',
				{
					input: true,
				},
				(self: any) => self
			)
		}).toThrow()

		const B = typedef({
			'@type': A,
		})
		funcdef(
			B,
			'func2',
			{
				input: true,
			},
			(self: any) => self
		)
		expect(() => {
			funcdef(
				B,
				'func2',
				{
					input: true,
				},
				(self: any) => self
			)
		}).toThrow()
		expect(() => {
			funcdef(
				B,
				'func',
				{
					input: true,
				},
				(self: any) => self
			)
		}).toThrow()
	})

	test('function must have a name', () => {
		const tdesc = typedef({
			input: string,
		})
		;['', false, true, 0, 1, null, void 0, wrapval({})].forEach((v) => {
			expect(() => {
				funcdef(
					tdesc,
					v,
					{
						input: true,
					},
					(self: any) => self
				)
			}).toThrow()
		})
		funcdef(
			tdesc,
			'',
			{
				'@name': 'func',
				input: true,
			},
			(self: any) => self
		)
	})

	test('observation field is required', () => {
		const tdesc = typedef({
			input: string,
			out: string,
		})
		expect(() => {
			funcdef(tdesc, 'func', {}, (self: any) => {
				self.out = self.input
			})
		}).toThrow()
	})

	test('observe the same fields', () => {
		const tdesc = typedef({
			input: int32,
			out: int32,
			result: int32,
		})
		funcdef(
			tdesc,
			'func',
			{
				input: true,
			},
			(self: any) => {
				self.out = self.input * 2
			}
		)
		funcdef(
			tdesc,
			'func2',
			{
				input: true,
			},
			(self: any) => {
				self.result = self.input * 4
			}
		)
		const ret = typeinit(tdesc)
		expect(ret.input).toBe(0)
		expect(ret.out).toBe(0)
		expect(ret.result).toBe(0)
		ret.input = 2
		expect(ret.out).toBe(4)
		expect(ret.result).toBe(8)
	})

	test('observe the same substructure at the same time', () => {
		const Sub = typedef({
			'@noinit': true,
			arg1: int32,
			arg2: int32,
		})
		const A = typedef({
			name: string,
			sub: Sub,
			out: string,
		})
		funcdef(
			A,
			'func',
			{
				name: true,
				sub: {
					arg1: true,
					arg2: true,
				},
			},
			(self: any) => {
				self.out = `${self.name} {${self.sub.arg1}-${self.sub.arg2}}`
			}
		)
		const B = typedef({
			name: string,
			sub: Sub,
			out: string,
		})
		funcdef(
			B,
			'func',
			{
				name: true,
				sub: {
					arg1: true,
					arg2: true,
				},
			},
			(self: any) => {
				self.out = `${self.name} {${self.sub.arg1}-${self.sub.arg2}}`
			}
		)
		const sub = typeinit(Sub)
		expect(sub).toBeDefined()
		const a = typeinit(A)
		expect(a.sub).toBeUndefined()
		const b = typeinit(B)
		expect(b.sub).toBeUndefined()
		a.sub = sub
		b.sub = sub
		expect(a.out).toBe('')
		expect(b.out).toBe('')
		a.name = 'a'
		expect(a.out).toBe('a {0-0}')
		b.name = 'b'
		expect(b.out).toBe('b {0-0}')
		a.name = 'A'
		b.name = 'B'
		expect(a.out).toBe('a {0-0}')
		expect(b.out).toBe('b {0-0}')
		sub.arg1 = 1
		expect(a.out).toBe('a {0-0}')
		expect(b.out).toBe('b {0-0}')
		sub.arg2 = 2
		expect(a.out).toBe('A {1-2}')
		expect(b.out).toBe('B {1-2}')
	})

	test('remove substructure', () => {
		const Sub = typedef({
			'@noinit': true,
			arg1: int32,
			arg2: int32,
		})
		const tdesc = typedef({
			name: string,
			sub: Sub,
			out: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				sub: true,
			},
			(self: any) => self
		)
		funcdef(
			tdesc,
			'func2',
			{
				name: true,
				sub: {
					arg1: true,
					arg2: true,
				},
			},
			(self: any) => {
				if (!self.sub) {
					self.out = `${self.name} {}`
					return
				}
				self.out = `${self.name} {${self.sub.arg1}-${self.sub.arg2}}`
			}
		)
		funcdef(
			tdesc,
			'func3',
			{
				sub: {
					arg1: true,
				},
			},
			(self: any) => self
		)
		const sub = typeinit(Sub)
		const ret = typeinit(tdesc)
		ret.sub = sub
		ret.name = 'a'
		expect(ret.out).toBe('a {0-0}')
		ret.sub = null
		ret.name = 'A'
		expect(ret.out).toBe('A {}')
		sub.arg1 = 1
		sub.arg2 = 2
		expect(ret.out).toBe('A {}')
	})

	test('the observer does not observe that the substructure is nil', () => {
		const Sub = typedef({
			'@noinit': true,
			arg1: int32,
			arg2: int32,
		})
		const tdesc = typedef({
			name: string,
			sub: Sub,
			out: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				name: true,
				sub: {
					'@notnil': true,
					arg1: true,
					arg2: true,
				},
			},
			(self: any) => {
				self.out = `${self.name} {${self.sub.arg1}-${self.sub.arg2}}`
			}
		)
		const sub = typeinit(Sub)
		const ret = typeinit(tdesc)
		ret.sub = sub
		ret.name = 'a'
		expect(ret.out).toBe('a {0-0}')
		ret.sub = null
		ret.name = 'A'
		expect(ret.out).toBe('a {0-0}')
		sub.arg1 = 1
		sub.arg2 = 2
		expect(ret.out).toBe('a {0-0}')
	})

	test('the observer does not observe that the value is nil', () => {
		const tdesc = typedef({
			name: string,
			input: any,
			out: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				name: true,
				input: { '@notnil': true },
			},
			(self: any) => {
				self.out = `${self.name} ${self.input}`
			}
		)
		const ret = typeinit(tdesc)
		ret.name = 'a'
		expect(ret.out).toBe('')
		ret.input = 'test'
		expect(ret.out).toBe('a test')
		ret.name = 'A'
		ret.input = null
		expect(ret.out).toBe('a test')
		ret.input = void 0
		expect(ret.out).toBe('a test')
		ret.input = 0
		expect(ret.out).toBe('A 0')
	})

	test('observe an undefined field', () => {
		const tdesc = typedef({
			input: int32,
		})
		expect(() => {
			funcdef(
				tdesc,
				'func',
				{
					test: true,
				},
				(self: any) => self
			)
		}).toThrow()
	})

	test('observe a field with wrong description', () => {
		const tdesc = typedef({
			input: int32,
		})
		expect(() => {
			funcdef(
				tdesc,
				'func',
				{
					input: {},
				},
				(self: any) => self
			)
		}).toThrow()
	})

	test('observed fields is greater than 32', () => {
		const body: any = {}
		const observe: any = {}
		for (let i = 0; i <= 32; i++) {
			const n = 'name' + i
			body[n] = int32
			observe[n] = true
		}
		const tdesc = typedef({
			...body,
		})
		expect(() => {
			funcdef(
				tdesc,
				'func',
				{
					...observe,
				},
				(self: any) => self
			)
		}).toThrow()
	})

	test('check substructure conditions when assigning to structure', () => {
		const A = typedef({
			sub: typedef({
				input: string,
				arg: any,
			}),
		})
		const tdesc = typedef({
			a: A,
			output: string,
		})
		funcdef(
			tdesc,
			'func',
			{
				a: {
					'@notnil': true,
					sub: {
						'@notnil': true,
						input: { '@notnil': true },
						arg: { '@notnil': true },
					},
				},
			},
			(self: any) => {
				self.output = self.a.sub.input
			}
		)
		const a = typeinit(A)
		const sub = a.sub
		sub.input = 'test'
		sub.arg = 1
		a.sub = null
		const ret = typeinit(tdesc)
		ret.a = a
		expect(ret.output).toBe('')
		a.sub = sub
		expect(ret.output).toBe('test')
		ret.output = ''
		ret.a = null
		expect(ret.output).toBe('')
		sub.arg = null
		ret.a = a
		expect(ret.output).toBe('')
		sub.arg = 2
		expect(ret.output).toBe('')
		ret.a = a
		expect(ret.output).toBe('test')
	})

	test('infinite loop', () => {
		expect.assertions(1)
		const tdesc = typedef({
			input: int32,
		})
		funcdef(
			tdesc,
			'func',
			{
				input: true,
			},
			(self: any) => {
				expect(() => {
					self.input = 1
				}).toThrow()
			}
		)
		const ret = typeinit(tdesc)
		ret.input = 1
	})

	test('get function result by name', async () => {
		const tdesc = typedef({
			input: int32,
		})
		funcdef(
			tdesc,
			'func',
			{
				input: true,
			},
			(self: any) => {
				return self.input * 2
			}
		)
		const ret = typeinit(tdesc)
		const out = outcome(ret, 'func')
		expect(out).toBeInstanceOf(Promise)
		ret.input = 2
		expect(await out).toBe(4)
	})

	test('get the result of the first defined function', async () => {
		const tdesc = typedef({
			input: int32,
		})
		funcdef(
			tdesc,
			'func',
			{
				input: true,
			},
			(self: any) => {
				return self.input * 2
			}
		)
		funcdef(
			tdesc,
			'func2',
			{
				input: true,
			},
			(self: any) => {
				return self.input * 4
			}
		)
		const ret = typeinit(tdesc)
		const out = outcome(ret)
		const out2 = outcome(ret, 'func2')
		expect(out).toBeInstanceOf(Promise)
		expect(out2).toBeInstanceOf(Promise)
		ret.input = 2
		expect(await out).toBe(4)
		expect(await out2).toBe(8)
	})

	test('get async function result', async () => {
		const tdesc = typedef({
			input: int32,
		})
		funcdef(
			tdesc,
			'func',
			{
				input: true,
			},
			async (self: any) => {
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve(self.input * 2)
					})
				})
			}
		)
		const ret = typeinit(tdesc)
		const out = outcome(ret)
		const out2 = outcome(ret)
		expect(out).toBeInstanceOf(Promise)
		expect(out2).toBeInstanceOf(Promise)
		ret.input = 2
		expect(await out).toBe(4)
		expect(await out2).toBe(4)
	})

	test('get the result of the undefined function', () => {
		const tdesc = typedef({
			input: int32,
		})
		const ret = typeinit(tdesc)
		expect(() => {
			outcome(ret, 'func')
		}).toThrow()
	})

	test('get the result with wrong type', () => {
		;[true, 1, 'test', {}].forEach((v: any) => {
			expect(() => {
				outcome(v)
			}).toThrow()
		})
	})

	test('initialize struct with literal value', () => {
		const tdesc = typedef({
			name: string,
			sex: bool,
			age: int32,
			trend: float64,
		})
		const ret = typeinit(tdesc, {
			name: 'Amy',
			sex: true,
			age: 18,
			trend: 0.5,
		})
		expect(ret.name).toBe('Amy')
		expect(ret.sex).toBe(true)
		expect(ret.age).toBe(18)
		expect(ret.trend).toBe(0.5)
	})

	test('initialize struct with partial literal value', () => {
		const tdesc = typedef({
			name: string,
			sex: bool,
			sub: typedef({
				age: int32,
			}),
		})
		const ret = typeinit(tdesc, {
			sex: true,
			sub: null,
		})
		expect(ret.name).toBe('')
		expect(ret.sex).toBe(true)
		expect(ret.sub).toBeNull()
	})

	test('mock struct with partial literal value', () => {
		const tdesc = typedef({
			name: string,
			sex: bool,
		})
		const a = typeinit(
			tdesc,
			wrapval(
				{ '@mock': true },
				{
					sex: true,
				}
			)
		)
		expect(a.name).not.toBe('')
		expect(a.sex).toBe(true)
		const b = typeinit(tdesc, {
			name: wrapval({ '@mock': true }),
			sex: true,
		})
		expect(b.name).not.toBe('')
		expect(b.sex).toBe(true)
	})

	test('initialize struct with the old instance', () => {
		const tdesc = typedef({
			'@name': 'test',
			name: string,
			sex: bool,
		})
		const ret = typeinit(tdesc)
		expect(typeinit(tdesc, ret)).toBe(ret)
	})

	test('initialize substructure with the old instance', () => {
		const Sub = typedef({
			name: string,
			sex: bool,
		})
		const tdesc = typedef({
			sub: Sub,
		})
		const sub = typeinit(Sub)
		const ret = typeinit(tdesc, {
			sub: sub,
		})
		expect(ret.sub).toBe(sub)
	})

	test('initialize bool with literal value', () => {
		const tdesc = typedef({
			'@type': bool,
		})
		expect(typeinit(tdesc, false)).toBe(false)
		expect(typeinit(tdesc, true)).toBe(true)
	})

	test('initialize int32 with literal value', () => {
		const tdesc = typedef({
			'@type': int32,
		})
		expect(typeinit(tdesc, 123)).toBe(123)
	})

	test('initialize float64 with literal value', () => {
		const tdesc = typedef({
			'@type': float64,
		})
		expect(typeinit(tdesc, 0.123)).toBe(0.123)
	})

	test('initialize string with literal value', () => {
		const tdesc = typedef({
			'@type': string,
		})
		expect(typeinit(tdesc, 'test')).toBe('test')
	})

	test('initialize struct with wrong type of literal value', () => {
		const A = typedef({})
		const B = typedef({})
		const ret = typeinit(A)
		expect(typeinit(A, ret)).toBe(ret)
		;[typeinit(B), true, 1, 'test'].forEach((v) => {
			expect(() => {
				typeinit(A, v)
			}).toThrow()
		})
	})

	test('initialize bool with wrong type of literal value', () => {
		const tdesc = typedef({
			'@type': bool,
		})
		expect(typeinit(tdesc, false)).toBe(false)
		expect(typeinit(tdesc, true)).toBe(true)
		;[1, 'test', {}].forEach((v) => {
			expect(() => {
				typeinit(tdesc, v)
			}).toThrow()
		})
	})

	test('initialize int32 with wrong type of literal value', () => {
		const tdesc = typedef({
			'@type': int32,
		})
		expect(typeinit(tdesc, 123)).toBe(123)
		;[true, 0.123, 'test', {}].forEach((v) => {
			expect(() => {
				typeinit(tdesc, v)
			}).toThrow()
		})
	})

	test('initialize float64 with wrong type of literal value', () => {
		const tdesc = typedef({
			'@type': float64,
		})
		expect(typeinit(tdesc, 0.123)).toBe(0.123)
		;[true, 'test', {}].forEach((v) => {
			expect(() => {
				typeinit(tdesc, v)
			}).toThrow()
		})
	})

	test('initialize string with wrong type of literal value', () => {
		const tdesc = typedef({
			'@type': string,
		})
		expect(typeinit(tdesc, 'test')).toBe('test')
		;[true, 1, {}].forEach((v) => {
			expect(() => {
				typeinit(tdesc, v)
			}).toThrow()
		})
	})

	test('initialize struct by custom class', () => {
		class A {
			name?: string

			test() {
				return this.name
			}
		}
		const tdesc = typedef({
			'@class': A,
			name: string,
		})
		const ret = typeinit(tdesc)
		expect(ret).toBeInstanceOf(A)
		ret.name = 'test'
		expect(ret.test()).toBe('test')
	})

	test('initialize struct by wrong custom class', () => {
		expect(() => {
			typedef({
				'@class': true,
				name: string,
			})
		}).toThrow()
	})

	test('change', () => {
		const A = typedef({
			'@type': any,
			'@change': true,
			'@value': () => {
				return {}
			},
		})
		const B = typedef({
			a: A,
		})
		const C = typedef({
			b: B,
			out: bool,
		})
		funcdef(
			C,
			'func',
			{
				b: {
					'@notnil': true,
					a: true,
				},
			},
			(self: any) => {
				self.out = !self.out
			}
		)
		const c = typeinit(C)
		const b = c.b
		const a = b.a
		expect(c.out).toBe(false)
		change(b)
		expect(c.out).toBe(false)
		change(a)
		expect(c.out).toBe(true)
		change(a)
		expect(c.out).toBe(false)
		c.b = null
		expect(c.out).toBe(false)
		c.b = b
		expect(c.out).toBe(true)
		b.a = 0
		expect(c.out).toBe(false)
		c.b = null
		expect(c.out).toBe(false)
		c.b = b
		expect(c.out).toBe(true)

		typeinit(C).b.a = a
	})

	describe('wrapval', () => {
		test('the description is invalid', () => {
			;[null, 1, true, 'test'].forEach((v) => {
				expect(() => {
					wrapval(v)
				}).toThrow()
			})
		})

		test('cannot wrap the already wrapped value', () => {
			const ret = wrapval({})
			expect(() => {
				wrapval({}, ret)
			}).toThrow()
		})

		test('initialize use wrapval', () => {
			const tdesc = typedef({
				name: string,
			})
			expect(typeinit(tdesc, wrapval({})).name).toBe('')
			expect(
				typeinit(
					tdesc,
					wrapval(
						{},
						{
							name: 'test',
						}
					)
				).name
			).toBe('test')

			expect(typeinit(int32, wrapval({}))).toBe(0)
			expect(typeinit(int32, wrapval({}, 1))).toBe(1)
		})

		test('assign wrapval to structure field', () => {
			const tdesc = typedef({
				name: string,
			})
			const ret = typeinit(tdesc)
			expect(ret.name).toBe('')
			ret.name = wrapval({}, 'test')
			expect(ret.name).toBe('test')
		})
	})
})
