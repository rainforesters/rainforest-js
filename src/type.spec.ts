/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	array,
	bool,
	change,
	float64,
	int32,
	object,
	outcome,
	ruledef,
	string,
	structbody,
	structof,
	typedef,
	typeinit,
	unknown,
	wrapval,
	type Struct,
	type TypeDesc,
} from './type'

const at_mock: any = wrapval({ '@mock': true })

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

	test('declare an empty struct before, then complete its fields', () => {
		type tdesc = TypeDesc<
			Struct<{
				next: tdesc
			}>
		>
		const tdesc = typedef({}) as tdesc
		typedef(
			{
				'@notnil': true,
				next: tdesc,
			},
			tdesc
		)
		expect(structbody(tdesc).next).toBe(tdesc)
		expect(() => {
			typeinit(tdesc, null!)
		}).toThrow()
		expect(() => {
			typedef({
				'@notnil': true,
			})
		}).toThrow()
	})

	test('cannot use an empty struct', () => {
		const tdesc = typedef({})
		expect(() => {
			typeinit(tdesc)
		}).toThrow()
	})

	test('define new type with invalid description', () => {
		;[
			void 0,
			null,
			{ name: String },
			{ '-name': string },
			{ '1': string },
		].forEach((v: any) => {
			expect(() => {
				typedef(v)
			}).toThrow()
		})
	})

	test('define new type with a wrong type', () => {
		;[bool, int32, float64, string, unknown, true, 1, 'test', {}].forEach(
			(v: any) => {
				expect(() => {
					typedef(
						{},
						typedef({
							'@type': v,
						}) as any
					)
				}).toThrow()
			}
		)
		expect(() => {
			typedef({}, {} as any)
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
		].forEach((v: any) => {
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
				tdesc as any
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
				} as any)
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
				'@type': unknown,
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

	test('decorate unknown', () => {
		const tdesc = typedef({
			'@type': unknown,
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
			sub: typedef({
				arg: int32,
			}),
		})
		const B = typedef({
			'@type': A,
		})
		const a = typeinit(A)
		expect(structof(a) === A).toBe(true)
		expect(typeinit(structof(a)) !== a).toBe(true)
		const b = typeinit(B)
		expect(structof(b) === B).toBe(true)
		expect(typeinit(structof(b)) !== b).toBe(true)
		expect(a !== b).toBe(true)
		expect(a.sub !== b.sub).toBe(true)
		a.sub = b.sub
		expect(a.sub === b.sub).toBe(true)
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
			'@verify': (self) => self,
			'@assert': (self) => self,
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
		expect(Object.keys(ret).length).toBe(Object.keys(structbody(tdesc)).length)
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
		type tdesc = TypeDesc<
			Struct<{
				name: TypeDesc<string>
				next: tdesc
				list: TypeDesc<array<tdesc>>
			}>
		>
		const tdesc = typedef({}) as tdesc
		typedef(
			{
				name: string,
				next: tdesc,
				list: array as unknown as TypeDesc<array<tdesc>>,
			},
			tdesc
		)
		const ret = typeinit(tdesc)
		expect(ret.name).toBe('')
		expect(ret.next).toBeUndefined()
		expect(ret.list.length).toBe(0)
		ret.list.push(typeinit(tdesc))
		expect(ret.list[0].list.length).toBe(0)
		ret.list[0].list.push(typeinit(tdesc))
		expect(ret.list[0].list[0].list.length).toBe(0)

		type A = TypeDesc<
			Struct<{
				b: TypeDesc<Struct<Record<string, unknown>>>
				next: A
			}>
		>
		const A = typedef({}) as A
		const B = typedef({})
		typedef(
			{
				'@notnil': true,
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
			B as any
		)
		expect(typeinit(A).next).toBeUndefined()
	})

	test('assign struct with wrong type', () => {
		const A = typedef({
			value: bool,
		})
		const B = typedef({
			value: bool,
		})
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
		;[typeinit(A), typeinit(B), true, 1, 'test', {}].forEach((v: any) => {
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
		;[1, 'test', {}].forEach((v: any) => {
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
		;[true, 0.123, 'test', {}].forEach((v: any) => {
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
		;[true, 'test', {}].forEach((v: any) => {
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
		;[true, 1, {}].forEach((v: any) => {
			expect(() => {
				ret.value = v
			}).toThrow()
		})
	})

	test('verify bool', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': bool,
				'@verify': (self) => {
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
				'@verify': (self) => {
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
				'@verify': (self) => {
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
				'@verify': (self) => {
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

	test('verify the decorated type', () => {
		expect(() => {
			typeinit(
				typedef({
					'@type': unknown,
					'@notnil': true,
				})
			)
		}).toThrow()
		expect(() => {
			typeinit(
				typedef({
					'@type': unknown,
					'@notnil': true,
					'@value': (self) => self,
				})
			)
		}).toThrow()
		expect(() => {
			typeinit(
				typedef({
					'@type': unknown,
					'@verify': (self) => {
						if (!self) {
							throw Error('must not be nil')
						}
					},
					'@value': (self) => self,
				})
			)
		}).toThrow()
		expect(
			typeinit(
				typedef({
					'@type': unknown,
					'@value': (self) => self,
				})
			)
		).toBeUndefined()
	})

	test('adjust bool', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': bool,
				'@adjust': (self) => {
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
				'@type': typedef({
					'@type': int32,
					'@adjust': (self) => {
						return self * 2
					},
				}),
			}),
		})
		const ret = typeinit(tdesc, { value: 3 })
		expect(ret.value).toBe(6)
		ret.value = 1
		expect(ret.value).toBe(2)
		ret.value = 2
		expect(ret.value).toBe(4)
	})

	test('adjust float64', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': typedef({
					'@type': float64,
					'@adjust': (self) => {
						return self * 2
					},
				}),
				'@adjust': (self) => {
					return self * 2
				},
			}),
		})
		const ret = typeinit(tdesc, { value: 0.3 })
		expect(ret.value).toBe(1.2)
		ret.value = 0.1
		expect(ret.value).toBe(0.4)
		ret.value = 0.2
		expect(ret.value).toBe(0.8)
	})

	test('adjust string', () => {
		const tdesc = typedef({
			value: typedef({
				'@type': string,
				'@adjust': (self) => {
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
				'@adjust': (self) => {
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
			'@init': (self) => {
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

	test('retain&release reference', () => {
		const Ref = typedef({
			'@retain': (self) => {
				self.count++
			},
			'@release': (self) => {
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
		b.value = null!
		expect(ref.count).toBe(1)
		a.value = null!
		expect(ref.count).toBe(0)
	})

	test('retain&release reference in decorated type', () => {
		const Ref = typedef({
			'@type': typedef({
				'@retain': (self) => {
					self.count++
				},
				'@release': (self) => {
					self.count--
				},
				count: int32,
				out: int32,
			}),
			'@retain': (self) => {
				self.out++
			},
			'@release': (self) => {
				self.out--
			},
		})
		const tdesc = typedef({
			value: Ref,
			sub: typedef({
				'@type': Ref,
			}),
		})
		const a = typeinit(tdesc)
		const ref = a.value
		expect(ref.count).toBe(1)
		expect(ref.out).toBe(1)
		const sub = a.sub
		expect(sub.count).toBe(1)
		expect(sub.out).toBe(1)
		const b = typeinit(tdesc)
		expect(b.value.count).toBe(1)
		expect(b.value.out).toBe(1)
		expect(b.sub.count).toBe(1)
		expect(b.sub.out).toBe(1)
		b.value = ref
		expect(ref.count).toBe(2)
		expect(ref.out).toBe(2)
		b.sub = sub
		expect(sub.count).toBe(2)
		expect(sub.out).toBe(2)
		b.value = null!
		expect(ref.count).toBe(1)
		expect(ref.out).toBe(1)
		b.sub = null!
		expect(sub.count).toBe(1)
		expect(sub.out).toBe(1)
		a.value = null!
		expect(ref.count).toBe(0)
		expect(ref.out).toBe(0)
		a.sub = null!
		expect(sub.count).toBe(0)
		expect(sub.out).toBe(0)
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
			ret.a = null!
		}).toThrow()
		expect(ret.a).not.toBeNull()
		ret.a = typeinit(A)
		ret.a.name = 'test'
		expect(ret.a).not.toBeNull()
		expect(ret.a.name).toBe('test')
		expect(a.name).toBe('a')
		expect(ret.b).not.toBeNull()
		ret.b = null!
		expect(ret.b).toBeNull()
		expect(ret.c).not.toBeNull()
		expect(() => {
			ret.c = null!
		}).toThrow()
		expect(ret.c).not.toBeNull()

		expect(() => {
			typeinit(tdesc, {
				a: null!,
			})
		}).toThrow()
	})

	test('noinit', () => {
		const A = typedef({
			'@noinit': true,
			name: string,
		})
		const B = typedef({
			'@type': typedef({
				name: string,
			}),
			'@noinit': true,
		})
		const C = typedef({
			'@type': unknown,
			'@noinit': true,
			'@value': () => false,
		})
		const D = typedef({
			name: string,
		})
		const tdesc = typedef({
			a: A,
			b: B,
			c: C,
			d: D,
		})
		const ret = typeinit(tdesc)
		expect(ret.a).toBeUndefined()
		ret.a = typeinit(A)
		expect(ret.a).not.toBeNull()
		ret.a = null!
		expect(ret.a).toBeNull()
		expect(ret.b).toBeUndefined()
		ret.b = typeinit(B)
		expect(ret.b).not.toBeNull()
		ret.b = null!
		expect(ret.b).toBeNull()
		expect(ret.c).toBeUndefined()
		ret.c = typeinit(C)
		expect(ret.c).not.toBeNull()
		ret.c = false
		expect(ret.c).toBe(false)
		ret.c = true
		expect(ret.c).toBe(true)
		expect(ret.d).not.toBeNull()
		ret.d = null!
		expect(ret.d).toBeNull()
		expect(typeinit(A)).toBeDefined()
		expect(typeinit(B)).toBeDefined()
		expect(typeinit(C)).toBe(false)
	})

	test('noinit & notnil', () => {
		const A = typedef({
			'@noinit': true,
			'@notnil': true,
			name: string,
		})
		const B = typedef({
			name: string,
		})
		const tdesc = typedef({
			a: A,
			b: B,
		})
		const ret = typeinit(tdesc, {
			a: typeinit(A),
		})
		expect(ret.a.name).toBe('')

		expect(() => {
			typeinit(tdesc)
		}).toThrow()
	})

	test('define a rule', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			arg3: int32,
			out: string,
		})
		ruledef(
			tdesc,
			'rule',
			{
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self) => {
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

	test('define two rules', () => {
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
		ruledef(
			A,
			'rule',
			{
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self) => self
		)

		const tdesc = typedef({
			'@type': A,
		})
		ruledef(
			tdesc,
			'rule2',
			{
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self) => {
				self.out = `${self.arg1}-${self.arg2}-${self.arg3}`
			}
		)
		ruledef(
			tdesc,
			'rule3',
			{
				param1: true,
				param2: true,
				param3: true,
			},
			(self) => {
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

	test('define a rule on substructure', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			sub: typedef({
				param1: string,
				param2: string,
			}),
			out: string,
		})
		ruledef(
			tdesc,
			'rule',
			{
				arg1: true,
				arg2: true,
				sub: {
					param1: true,
					param2: true,
				},
			},
			(self) => {
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

	test('the rule is executed when the value is different', () => {
		const tdesc = typedef({
			input: int32,
			out: bool,
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			(self) => {
				self.out = !self.out
				self.input = wrapval({ '@diff': true }, self.input)
			}
		)
		const ret = typeinit(tdesc)
		expect(ret.out).toBe(false)
		ret.input = 1
		expect(ret.out).toBe(true)
		ret.input = 2
		expect(ret.out).toBe(false)
		ret.input = wrapval({ '@diff': true }, 1)
		expect(ret.out).toBe(true)
		ret.input = wrapval({ '@diff': true }, 1)
		expect(ret.out).toBe(true)
		ret.input = wrapval({ '@diff': true }, 2)
		expect(ret.out).toBe(false)
		ret.input = wrapval({ '@diff': true }, 2)
		expect(ret.out).toBe(false)
	})

	test('the rule is executed when the parameters are different', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			out: string,
		})
		ruledef(
			tdesc,
			'rule',
			{
				arg1: { '@diff': true },
				arg2: { '@diff': true },
			},
			(self) => {
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

	test('define a rule use logical OR', () => {
		const tdesc = typedef({
			arg1: int32,
			arg2: int32,
			arg3: int32,
			out: string,
		})
		ruledef(
			tdesc,
			'rule',
			{
				'@or': true,
				arg1: true,
				arg2: true,
				arg3: true,
			},
			(self) => {
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

	test('define a rule on a decorated struct', () => {
		const tdesc = typedef({
			'@type': typedef({
				input: string,
			}),
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			(self) => self
		)
	})

	test('define a rule with unexpected arguments', () => {
		const tdesc = typedef({
			input: string,
		})
		expect(() => {
			ruledef(tdesc, 'rule', null!, (self) => self)
		}).toThrow()
		expect(() => {
			ruledef(
				tdesc,
				'rule',
				{
					input: true,
				},
				null!
			)
		}).toThrow()

		expect(() => {
			ruledef(1 as any, '', null!, null!)
		}).toThrow()
		expect(() => {
			ruledef(unknown as any, '', null!, null!)
		}).toThrow()
	})

	test('duplicate rule', () => {
		const tdesc = typedef({
			input: string,
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			(self) => self
		)
		expect(() => {
			ruledef(
				tdesc,
				'rule',
				{
					input: true,
				},
				(self) => self
			)
		}).toThrow()
	})

	test('duplicate rule on a decorated struct', () => {
		const A = typedef({
			input: string,
		})
		ruledef(
			A,
			'rule',
			{
				input: true,
			},
			(self) => self
		)
		expect(() => {
			ruledef(
				A,
				'rule',
				{
					input: true,
				},
				(self) => self
			)
		}).toThrow()

		const B = typedef({
			'@type': A,
		})
		ruledef(
			B,
			'rule2',
			{
				input: true,
			},
			(self) => self
		)
		expect(() => {
			ruledef(
				B,
				'rule2',
				{
					input: true,
				},
				(self) => self
			)
		}).toThrow()
		expect(() => {
			ruledef(
				B,
				'rule',
				{
					input: true,
				},
				(self) => self
			)
		}).toThrow()
	})

	test('rule must have a name', () => {
		const tdesc = typedef({
			input: string,
		})
		;['', false, true, 0, 1, null, void 0, wrapval({})].forEach((v: any) => {
			expect(() => {
				ruledef(
					tdesc,
					v,
					{
						input: true,
					},
					(self) => self
				)
			}).toThrow()
		})
		ruledef(
			tdesc,
			'',
			{
				'@name': 'rule',
				input: true,
			},
			(self) => self
		)
	})

	test('observation field is required', () => {
		const tdesc = typedef({
			input: string,
			out: string,
		})
		expect(() => {
			ruledef(tdesc, 'rule', {}, (self) => {
				self.out = self.input
			})
		}).toThrow()
		expect(() => {
			ruledef(
				tdesc,
				'rule',
				{
					'@or': true,
				},
				(self) => {
					self.out = self.input
				}
			)
		}).toThrow()
		expect(() => {
			ruledef(
				tdesc,
				'rule',
				{
					'@or': true,
					'@diff': true,
					'@notnil': true,
				} as any,
				(self) => {
					self.out = self.input
				}
			)
		}).toThrow()
		expect(() => {
			ruledef(
				tdesc,
				'rule',
				{
					'@diff': true,
					'@notnil': true,
				} as any,
				(self) => {
					self.out = self.input
				}
			)
		}).toThrow()
	})

	test('observe the same fields', () => {
		const tdesc = typedef({
			input: int32,
			out: int32,
			result: int32,
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			(self) => {
				self.out = self.input * 2
			}
		)
		ruledef(
			tdesc,
			'rule2',
			{
				input: true,
			},
			(self) => {
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
		ruledef(
			A,
			'rule',
			{
				name: true,
				sub: {
					arg1: true,
					arg2: true,
				},
			},
			(self) => {
				self.out = `${self.name} {${self.sub.arg1}-${self.sub.arg2}}`
			}
		)
		const B = typedef({
			name: string,
			sub: Sub,
			out: string,
		})
		ruledef(
			B,
			'rule',
			{
				name: true,
				sub: {
					arg1: true,
					arg2: true,
				},
			},
			(self) => {
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
		ruledef(
			tdesc,
			'rule',
			{
				sub: true,
			},
			(self) => self
		)
		ruledef(
			tdesc,
			'rule2',
			{
				name: true,
				sub: {
					arg1: true,
					arg2: true,
				},
			},
			(self) => {
				self.out = `${self.name} {${self.sub.arg1}-${self.sub.arg2}}`
			}
		)
		ruledef(
			tdesc,
			'rule3',
			{
				sub: {
					arg1: true,
				},
			},
			(self) => self
		)
		const sub = typeinit(Sub)
		const ret = typeinit(tdesc)
		ret.sub = sub
		ret.name = 'a'
		expect(ret.out).toBe('a {0-0}')
		ret.sub = null!
		ret.name = 'A'
		expect(ret.out).toBe('a {0-0}')
		sub.arg1 = 1
		sub.arg2 = 2
		expect(ret.out).toBe('a {0-0}')
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
		ruledef(
			tdesc,
			'rule',
			{
				name: true,
				sub: {
					arg1: true,
					arg2: true,
				},
			},
			(self) => {
				self.out = `${self.name} {${self.sub.arg1}-${self.sub.arg2}}`
			}
		)
		const sub = typeinit(Sub)
		const ret = typeinit(tdesc)
		ret.sub = sub
		ret.name = 'a'
		expect(ret.out).toBe('a {0-0}')
		ret.sub = null!
		ret.name = 'A'
		expect(ret.out).toBe('a {0-0}')
		sub.arg1 = 1
		sub.arg2 = 2
		expect(ret.out).toBe('a {0-0}')
	})

	test('the observer does not observe that the value is nil', () => {
		const tdesc = typedef({
			name: string,
			input: unknown,
			out: string,
		})
		ruledef(
			tdesc,
			'rule',
			{
				name: true,
				input: { '@notnil': true },
			},
			(self) => {
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
			ruledef(
				tdesc,
				'rule',
				{
					test: true,
				} as any,
				(self) => self
			)
		}).toThrow()
	})

	test('observe a field with wrong description', () => {
		const tdesc = typedef({
			input: int32,
		})
		expect(() => {
			ruledef(
				tdesc,
				'rule',
				{
					input: {},
				},
				(self) => self
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
			ruledef(
				tdesc,
				'rule',
				{
					...observe,
				},
				(self) => self
			)
		}).toThrow()
	})

	test('check substructure conditions when assigning to structure', () => {
		const A = typedef({
			sub: typedef({
				input: string,
				arg: unknown,
			}),
		})
		const tdesc = typedef({
			a: A,
			output: string,
		})
		ruledef(
			tdesc,
			'rule',
			{
				a: {
					sub: {
						input: { '@notnil': true },
						arg: { '@notnil': true },
					},
				},
			},
			(self) => {
				self.output = self.a.sub.input
			}
		)
		const a = typeinit(A)
		const sub = a.sub
		sub.input = 'test'
		sub.arg = 1
		a.sub = null!
		const ret = typeinit(tdesc)
		ret.a = a
		expect(ret.output).toBe('')
		a.sub = sub
		expect(ret.output).toBe('test')
		ret.output = ''
		ret.a = null!
		expect(ret.output).toBe('')
		sub.arg = null
		ret.a = a
		expect(ret.output).toBe('')
		sub.arg = 2
		expect(ret.output).toBe('')
		ret.a = a
		expect(ret.output).toBe('test')
	})

	test('the last rule is not over yet', () => {
		expect.assertions(2)
		const Sub = typedef({
			input: int32,
		})
		const tdesc = typedef({
			input: int32,
			sub: Sub,
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			(self) => {
				expect(() => {
					self.input = 1
				}).toThrow()
			}
		)
		ruledef(
			tdesc,
			'rule2',
			{
				sub: {
					input: true,
				},
			},
			(self) => {
				expect(() => {
					self.sub = typeinit(Sub)
				}).toThrow()
			}
		)
		const ret = typeinit(tdesc)
		ret.input = 1
		ret.sub.input = 1
	})

	test('get rule result by name', async () => {
		const tdesc = typedef({
			input: int32,
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			(self) => {
				return self.input * 2
			}
		)
		const ret = typeinit(tdesc)
		const out = outcome(ret, 'rule')
		expect(out).toBeInstanceOf(Promise)
		ret.input = 2
		expect(await out).toBe(4)
	})

	test('get the result of the first defined rule', async () => {
		const tdesc = typedef({
			input: int32,
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			(self) => {
				return self.input * 2
			}
		)
		ruledef(
			tdesc,
			'rule2',
			{
				input: true,
			},
			(self) => {
				return self.input * 4
			}
		)
		const ret = typeinit(tdesc)
		const out = outcome(ret)
		const out2 = outcome(ret, 'rule2')
		expect(out).toBeInstanceOf(Promise)
		expect(out2).toBeInstanceOf(Promise)
		ret.input = 2
		expect(await out).toBe(4)
		expect(await out2).toBe(8)
	})

	test('get async rule result', async () => {
		const tdesc = typedef({
			input: int32,
		})
		ruledef(
			tdesc,
			'rule',
			{
				input: true,
			},
			async (self) => {
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

	test('get the result of the undefined rule', () => {
		const tdesc = typedef({
			input: int32,
		})
		const ret = typeinit(tdesc)
		expect(() => {
			outcome(ret, 'rule')
		}).toThrow()
		expect(() => {
			outcome(ret)
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
			sub: null!,
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
			name: wrapval({ '@mock': true }) as string,
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

	test('initialize unkonwn with literal value', () => {
		const tdesc = typedef({
			'@type': unknown,
		})
		expect(typeinit(tdesc, null)).toBe(null)
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
		const A = typedef({
			value: bool,
		})
		const B = typedef({
			value: bool,
		})
		const ret = typeinit(A)
		expect(typeinit(A, ret)).toBe(ret)
		;[typeinit(B), true, 1, 'test'].forEach((v: any) => {
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
		;[1, 'test', {}].forEach((v: any) => {
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
		;[true, 0.123, 'test', {}].forEach((v: any) => {
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
		;[true, 'test', {}].forEach((v: any) => {
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
		;[true, 1, {}].forEach((v: any) => {
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
		const ret = typeinit(tdesc) as unknown as A
		expect(ret).toBeInstanceOf(A)
		ret.name = 'test'
		expect(ret.test()).toBe('test')
	})

	test('initialize struct by wrong custom class', () => {
		;[true, 1, {}].forEach((v: any) => {
			expect(() => {
				typedef({
					'@class': v,
					name: string,
				})
			}).toThrow()
		})
	})

	test('change', () => {
		const A = typedef({
			'@type': unknown,
			'@change': true,
			'@value': () => ({}),
		})
		const B = typedef({
			a: A,
		})
		const C = typedef({
			b: B,
			out: bool,
		})
		ruledef(
			C,
			'rule',
			{
				b: {
					a: true,
				},
			},
			(self) => {
				self.out = !self.out
			}
		)
		const c = typeinit(C)
		const b = c.b
		const a: any = b.a
		expect(c.out).toBe(false)
		change(b)
		expect(c.out).toBe(false)
		change(a)
		expect(c.out).toBe(true)
		change(a)
		expect(c.out).toBe(false)
		c.b = null!
		expect(c.out).toBe(false)
		c.b = b
		expect(c.out).toBe(true)
		b.a = 0
		expect(c.out).toBe(false)
		c.b = null!
		expect(c.out).toBe(false)
		c.b = b
		expect(c.out).toBe(true)
		b.a = a
		expect(c.out).toBe(false)
		change(a)
		expect(c.out).toBe(true)

		typeinit(C).b.a = a

		typeinit(B).a = null!

		const D = typedef({
			a: A,
			out: bool,
		})
		ruledef(
			D,
			'rule',
			{
				a: {
					'@diff': true,
				},
			},
			(self) => {
				self.out = !self.out
			}
		)
		const d = typeinit(D)
		expect(d.out).toBe(false)
		d.a = a
		expect(d.out).toBe(true)
		d.a = a
		expect(d.out).toBe(true)
		change(a)
		expect(c.out).toBe(false)
		expect(d.out).toBe(true)
		change(a)
		expect(c.out).toBe(true)
		expect(d.out).toBe(true)
		d.a = 0
		expect(d.out).toBe(false)
		d.a = 0
		expect(d.out).toBe(false)
	})

	describe('wrapval', () => {
		test('the description is invalid', () => {
			;[null, 1, true, 'test'].forEach((v: any) => {
				expect(() => {
					wrapval(v as any)
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

			expect(typeinit(int32, wrapval({}) as int32)).toBe(0)
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

	describe('builtin', () => {
		test('object', () => {
			const tdesc = typedef({
				value: object,
			})
			const ret = typeinit(tdesc)
			expect(ret.value).toBeDefined()
			ret.value = (void 0)!
			expect(ret.value).toBeUndefined()
			ret.value = null!
			expect(ret.value).toBeNull()
			ret.value = {}
			expect(ret.value).toBeInstanceOf(Object)
			ret.value = [] as any
			expect(ret.value).toBeInstanceOf(Array)
			;[true, 1, 'test'].forEach((v) => {
				expect(() => {
					ret.value = v as any
				}).toThrow()
			})
		})

		test('array', () => {
			const tdesc = typedef({
				value: array,
			})
			const ret = typeinit(tdesc)
			expect(ret.value).toBeDefined()
			ret.value = (void 0)!
			expect(ret.value).toBeUndefined()
			ret.value = null!
			expect(ret.value).toBeNull()
			ret.value = []
			expect(ret.value).toBeInstanceOf(Array)
			;[{}, true, 1, 'test'].forEach((v: any) => {
				expect(() => {
					ret.value = v
				}).toThrow()
			})
		})
	})
})
