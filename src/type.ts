/**
 * Copyright (c) 2020 muchan92
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { random } = Math

const RE_name = /^[a-z][a-z0-9_]*$/i,
	RE_identifier = /^[a-z_][a-z0-9_]*$/i

const at_name = '@name',
	at_type = '@type',
	at_mock = '@mock',
	at_value = '@value',
	at_verify = '@verify',
	at_adjust = '@adjust',
	at_assert = '@assert',
	at_init = '@init',
	at_retain = '@retain',
	at_release = '@release',
	at_noinit = '@noinit',
	at_notnil = '@notnil',
	at_change = '@change',
	at_or = '@or',
	at_diff = '@diff',
	at_class = '@class'

const syl_name = Symbol(),
	syl_desc = Symbol('desc'),
	syl_kind = Symbol('kind'),
	syl_type = Symbol('type'),
	syl_mock = Symbol('mock'),
	syl_value = Symbol('value'),
	syl_verify = Symbol('verify'),
	syl_adjust = Symbol('adjust'),
	syl_assert = Symbol('assert'),
	syl_init = Symbol('init'),
	syl_retain = Symbol('retain'),
	syl_release = Symbol('release'),
	syl_meta = Symbol('meta'),
	syl_body = Symbol('body'),
	syl_proto = Symbol('proto'),
	syl_virtual = Symbol('virtual'),
	syl_accept = Symbol('accept'),
	syl_observers = Symbol('observers'),
	syl_outcome = Symbol('outcome'),
	syl_wrap = Symbol('wrap'),
	syl_class = Symbol('class')

const changeMap = new WeakMap<any, Set<VirtualValue>>()

const propCache = new Array(64)
for (let i = 0; i < 64; i++) {
	propCache[i] = propDef(i)
}

function propDef(index: number) {
	return (
		propCache[index] || {
			configurable: true,
			enumerable: true,
			get: function () {
				return this[syl_virtual][index].value
			},
			set: function (val: unknown) {
				VirtualValue_set(this[syl_virtual][index], val, this)
			},
		}
	)
}

function hideProp<T>(obj: unknown, key: string | number | symbol, value: T): T {
	Object.defineProperty(obj, key, {
		value,
	})
	return value
}

function toFunc(f: unknown, msg: string): Function {
	if (f) {
		if (!isFunc(f)) {
			throw Error(`${msg} is not a function`)
		}
		return f
	}
	return null!
}

function isFunc(v: unknown): v is Function {
	return typeof v === 'function'
}

function isString(v: unknown): v is string {
	return typeof v === 'string'
}

function isObject(v: unknown): v is Record<string, unknown> {
	return null !== v && typeof v === 'object'
}

function isNotnil(v: unknown): boolean {
	return null !== v && void 0 !== v
}

type WrapValueDesc = Record<`@${string}`, unknown>

interface WrapValue {
	[syl_wrap]: true
	[syl_desc]: WrapValueDesc
	[syl_value]: unknown
}

function isWrapValue(v: unknown): v is WrapValue {
	return isObject(v) && syl_wrap in v
}

/**
 * 使用描述来包装值
 *
 * @param desc - 描述说明
 * @param val  - 被包装的值
 * @returns 返回新的包装好的值
 *
 * @public
 */
export function wrapval<T>(desc: WrapValueDesc, val?: T): T {
	if (!isObject(desc)) {
		throw Error('description is invalid')
	}
	if (isWrapValue(val)) {
		throw Error('cannot wrap the already wrapped value')
	}
	return <T>(<unknown>{
		[syl_wrap]: true,
		[syl_desc]: desc,
		[syl_value]: val,
	})
}

interface ProtoDesc {
	[syl_type]: TypeDesc<unknown>
	[syl_body]: Record<string, FieldDesc> // 可以直接访问的字段集合
	[syl_proto]: Record<string, PropertyDescriptorMap>
}

interface FieldDesc {
	type: TypeDesc<unknown> // 字段类型
	index: number // 字段索引偏移
}

const enum Kind {
	unknown,
	primitive,
	struct,
	decorate,
}

const enum Meta {
	noinit = 1, // 禁用自动实例化，只能手动实例化
	notnil = 2, // 不允许为空
	change = 4, // 标记会手动管理数据内部变动情况（适用于 Array Set Map 等）
	adjust = 8, // 是否具有 adjust
	retain = 16, // 是否具有 retain
	release = 32, // 是否具有 release
}

// type Chars<T> = T extends `${infer First}${infer Rest}`
// 	? First | Chars<Rest>
// 	: never
// type IdentifierFirst = Chars<'abcdefghijklmnopqrstuvwxyz_'>
// type IdentifierChars = IdentifierFirst | Chars<'0123456789'>
// type Identifier<
// 	T,
// 	S = T extends string ? Lowercase<T> : never
// > = S extends `${infer First}${infer _}`
// 	? First extends IdentifierFirst
// 		? Chars<S> extends IdentifierChars
// 			? T
// 			: never
// 		: never
// 	: never
type Identifier<T> = T extends string ? T : never

type Desc<T> = T extends { [at_type]: TypeDesc<unknown> }
	? Partial<DescType<T>> | DescType<T>
	:
			| {
					[K in keyof T]: K extends keyof DescType<T>
						? DescType<T>[K]
						: (T[K] extends TypeDesc<unknown> ? T[K] : TypeDesc<unknown>) &
								(K extends Identifier<K>
									? T[K] extends TypeDesc<unknown>
										? T[K]
										: TypeDesc<unknown>
									: never)
			  }
			| DescType<T>

type DescType<T, Self = typeinit<_typedef_<T>>> = {
	[at_name]: string
	[at_type]: TypeDesc<unknown>
	[at_mock]: (self: Self) => Self
	[at_value]: (self: Self) => Self
	[at_verify]: (self: Self) => void
	[at_adjust]: (self: Self) => Self
	[at_assert]: (self: Self) => void
	[at_init]: (self: Self) => void
	[at_retain]: (
		self: Self,
		parentStruct: Struct<StructType>,
		fieldName: string
	) => void
	[at_release]: (
		self: Self,
		parentStruct: Struct<StructType>,
		fieldName: string
	) => void
	[at_noinit]: true
	[at_notnil]: true
	[at_change]: true
	[at_class]: { new (): unknown }
}

declare const __type__: unique symbol

interface _TypeDesc_<T> {
	[__type__]: 'TypeDesc'
	/**
	 * @internal
	 */
	[syl_name]: string
	/**
	 * @internal
	 */
	[syl_kind]: Kind
	/**
	 * @internal
	 */
	[syl_type]: TypeDesc<T>[] // 待修饰的类型描述链
	/**
	 * @internal
	 */
	[syl_mock]: Function // 实例化时返回模拟数据
	/**
	 * @internal
	 */
	[syl_value]: Function // 实例化时返回默认数据
	/**
	 * @internal
	 */
	[syl_verify]: Function // 对数据进行校验
	/**
	 * @internal
	 */
	[syl_adjust]: Function // 对数据进行修正
	/**
	 * @internal
	 */
	[syl_assert]: Function // 对数据进行断言
	/**
	 * @internal
	 */
	[syl_init]: Function // 对数据进行初始化
	/**
	 * @internal
	 */
	[syl_retain]: Function // 被 struct 引用时调用
	/**
	 * @internal
	 */
	[syl_release]: Function // 从 struct 中移除时调用
	/**
	 * @internal
	 */
	[syl_meta]: Meta // 禁用自动实例化，只能手动实例化

	/**
	 * @internal
	 */
	[syl_body]: StructTypeDesc // struct 字段集合
	/**
	 * @internal
	 */
	[syl_observers]: Map<unknown, ObserveFieldNodeDesc> // 定义的规则集合
	/**
	 * @internal
	 */
	[syl_accept]: Set<TypeDesc<unknown>> // 能够认可的类型描述集合
	/**
	 * @internal
	 */
	[syl_proto]: ProtoDesc // struct 原型描述
	/**
	 * @internal
	 */
	[syl_class]: { new (): unknown }
}

/**
 * @public
 */
export type TypeDesc<T> = _TypeDesc_<T>

const TypeDesc = class TypeDesc {}

type _Struct_ = {
	[__type__]: 'Struct'
	/**
	 * @internal
	 */
	[syl_virtual]: VirtualValue[] // 虚拟字段值
	/**
	 * @internal
	 */
	[syl_observers]: Map<unknown, ObserveNode>
	/**
	 * @internal
	 */
	[syl_init]: TypeDesc<unknown> // 初始化时的类型描述（可能是修饰后的类型描述）

	/**
	 * @internal
	 */
	[syl_type]: TypeDesc<unknown>
}

type StructType = Record<string, unknown>
type StructTypeDesc = Record<string, TypeDesc<unknown>>

/**
 * @public
 */
export type Struct<T extends StructType> = T & _Struct_

const Struct = class Struct {}

function isStruct(v: unknown): v is Struct<StructType> {
	return isObject(v) && syl_virtual in v
}

function isTypeDesc(v: unknown): v is TypeDesc<unknown> {
	return isObject(v) && syl_kind in v
}

function TypeDesc_kind(self: TypeDesc<unknown>) {
	const kind = self[syl_kind]
	return kind === Kind.decorate ? self[syl_type][0][syl_kind] : kind
}

function fieldError(fieldName: string, msg: string) {
	return fieldName ? `field '${fieldName}' ${msg}` : msg
}

function fieldValueError(
	fieldName: string,
	expectedType: string,
	gotValue: unknown
) {
	return fieldError(
		fieldName,
		`expected ${expectedType}, but got ` +
			(typeof gotValue === 'string' ? `'${gotValue}'` : gotValue)
	)
}

const enum Flag {
	adjust = 1, // 对数据进行修正
	self = 2, // 只校验当前自身的类型描述
}

function TypeDesc_check(
	self: TypeDesc<unknown>,
	accepted: TypeDesc<unknown>,
	val: unknown,
	flag: Flag,
	fieldName: string
) {
	switch (self[syl_kind]) {
		case Kind.struct:
			if (isNotnil(val)) {
				if (!isStruct(val)) {
					throw TypeError(fieldValueError(fieldName, 'struct', val))
				}
				if (!val[syl_init][syl_accept].has(accepted)) {
					if (val[syl_type] !== self) {
						throw TypeError(fieldError(fieldName, 'type mismatch'))
					}
					throw TypeError(fieldError(fieldName, 'decorate mismatch'))
				}
			} else if (self[syl_meta] & Meta.notnil) {
				throw Error(fieldError(fieldName, 'must not be nil'))
			}
			self[syl_verify]?.(val)
			if (flag & Flag.adjust && self[syl_adjust]) {
				val = TypeDesc_check(
					self,
					accepted,
					self[syl_adjust](val),
					0,
					fieldName
				)
			}
			self[syl_assert]?.(val)
			break
		case Kind.decorate: {
			const ts = self[syl_type]
			const l = ts.length
			let i = 1
			if (flag & Flag.self) {
				// 只校验当前自身的类型描述
				i = l
			} else {
				// 首先校验原始的类型描述
				val = TypeDesc_check(ts[0], accepted, val, flag, fieldName)
			}
			let b = true
			let t: TypeDesc<unknown>
			// 按顺序校验类型描述链
			do {
				if (i < l) {
					t = ts[i++]
				} else {
					t = self
					b = false
				}
				if (t[syl_meta] & Meta.notnil && !isNotnil(val)) {
					throw Error(fieldError(fieldName, 'must not be nil'))
				}
				t[syl_verify]?.(val)
				if (flag & Flag.adjust && t[syl_adjust]) {
					val = TypeDesc_check2(t, accepted, val, 0, syl_adjust, fieldName)
				}
				t[syl_assert]?.(val)
			} while (b)
			break
		}
		case Kind.primitive: {
			const t = typeof val
			switch (self) {
				case int32:
					if (t !== 'number' || val !== ((<int32>val) | 0)) {
						throw TypeError(fieldValueError(fieldName, 'int32', val))
					}
					break
				case float64:
					if (t !== 'number') {
						throw TypeError(fieldValueError(fieldName, 'float64', val))
					}
					break
				case string:
					if (t !== 'string') {
						throw TypeError(fieldValueError(fieldName, 'string', val))
					}
					break
				case bool:
					if (t !== 'boolean') {
						throw TypeError(fieldValueError(fieldName, 'bool', val))
					}
					break
			}
			break
		}
	}
	return val
}

function TypeDesc_check2(
	self: TypeDesc<unknown>,
	accepted: TypeDesc<unknown>,
	val: unknown,
	flag: Flag,
	syl: typeof syl_mock | typeof syl_value | typeof syl_adjust,
	fieldName: string
) {
	const newVal = self[syl](val)
	if (val !== newVal || isObject(newVal)) {
		val = TypeDesc_check(self, accepted, newVal, flag, fieldName)
	} else if (flag) {
		// 即使与原值相同，也要对修饰的类型描述自身进行校验，防止绕过校验
		val = TypeDesc_check(self, accepted, newVal, flag | Flag.self, fieldName)
	}
	return val
}

function TypeDesc_prepare(
	self: TypeDesc<unknown>,
	accepted: TypeDesc<unknown>,
	val: unknown,
	mock: boolean,
	isLiteral: boolean,
	fieldName: string
): unknown {
	if (isLiteral) {
		return TypeDesc_check(
			self,
			accepted,
			val,
			Flag.adjust | Flag.self,
			fieldName
		)
	}
	if (mock && self[syl_mock]) {
		val = TypeDesc_check2(self, accepted, val, Flag.adjust, syl_mock, fieldName)
	} else if (self[syl_value]) {
		val = TypeDesc_check2(
			self,
			accepted,
			val,
			Flag.adjust,
			syl_value,
			fieldName
		)
	} else {
		val = TypeDesc_check(
			self,
			accepted,
			val,
			Flag.adjust | Flag.self,
			fieldName
		)
	}
	if (isNotnil(val)) {
		if (self[syl_observers]) {
			// 如果有观察者，则构造观察者结构
			const struct = <Struct<StructType>>val
			let virtual: VirtualValue
			let map = struct[syl_observers]
			if (map) {
				virtual = map.values().next().value.virtual
			} else {
				virtual = {
					name: '',
					value: struct,
					observers: new Set<ObserveNode>(),
					type: null!,
					dist: 0,
					running: false,
				}
				map = hideProp(struct, syl_observers, new Map<string, ObserveNode>())
			}
			for (const [k, v] of self[syl_observers]) {
				const node = ObserveNode_init(v)
				node.executor = v.executor!
				node.virtual = virtual
				node.running = false
				map.set(k, node)
				ObserveNode_distribute(node, virtual)
			}
		}
		self[syl_init]?.(val)
	}
	return val
}

function TypeDesc_init(
	self: TypeDesc<unknown>,
	accepted: TypeDesc<unknown>,
	literal: unknown,
	circular: Set<TypeDesc<unknown>>,
	mock: boolean,
	fieldName: string
): unknown {
	let isLiteral = false
	if (void 0 !== literal) {
		if (isWrapValue(literal)) {
			const desc = literal[syl_desc]
			literal = literal[syl_value]
			if (at_mock in desc && desc[at_mock]) {
				mock = true
			} else if (void 0 !== literal) {
				isLiteral = true
			}
		} else {
			isLiteral = true
		}
	}
	let ret: unknown
	switch (self[syl_kind]) {
		case Kind.struct: {
			if (isLiteral) {
				if (null === literal) {
					if (self[syl_meta] & Meta.notnil) {
						throw Error(fieldError(fieldName, 'must not be nil'))
					}
					return literal
				}
				if (isStruct(literal)) {
					ret = literal
					break
				}
			}
			if (void 0 !== literal) {
				if (!isObject(literal)) {
					throw TypeError(fieldValueError(fieldName, 'struct', literal))
				}
				isLiteral = false
			}
			if (!circular) {
				circular = new Set<TypeDesc<unknown>>()
			} else if (circular.has(self)) {
				const ts = accepted[syl_type]
				const l = ts ? ts.length : 0
				let i = 0
				let b = true
				let t: TypeDesc<unknown>
				do {
					if (i < l) {
						t = ts[i++]
					} else {
						t = accepted
						b = false
					}
					if (t[syl_meta] & Meta.notnil) {
						// 因为循环引用，所以此时为 nil
						console.warn(
							`field '${fieldName}': This will form a circular reference, so it must be nil.`
						)
						return
					}
				} while (b)
				return
			}
			circular.add(self)
			ret = Object.create(self[syl_class].prototype)
			const proto = TypeDesc_proto(self)
			Object.setPrototypeOf(ret, proto)
			Object.defineProperties(ret, proto[syl_proto])
			// 设置初始化时的类型描述
			hideProp(ret, syl_init, accepted)
			// 构造虚拟的字段容器
			const virtual: VirtualValue[] = hideProp(ret, syl_virtual, [])
			const bd = self[syl_body]
			for (const k in bd) {
				const t = bd[k]
				const l = literal && literal[k]
				let v = l
				if (t[syl_meta] & Meta.noinit && void 0 === l) {
					if (t[syl_meta] & Meta.notnil) {
						throw Error(fieldError(k, 'must not be nil'))
					}
				} else {
					v = TypeDesc_init(t, t, l, circular, mock, k)
				}
				virtual.push({
					name: k,
					value: v,
					observers: new Set<ObserveNode>(),
					type: t,
					dist: 0,
					running: false,
				})
				if (t[syl_meta] & Meta.retain && isNotnil(v)) {
					if (t[syl_kind] === Kind.decorate) {
						const ts = t[syl_type]
						for (const t of ts) {
							t[syl_retain]?.(v, ret, k)
						}
					}
					t[syl_retain]?.(v, ret, k)
				}
			}
			circular.delete(self)
			break
		}
		case Kind.decorate: {
			const ts = self[syl_type]
			ret = TypeDesc_init(
				ts[0],
				accepted,
				isLiteral ? literal : void 0,
				circular,
				mock,
				fieldName
			)
			if (ts[0][syl_kind] === Kind.struct) {
				if (void 0 === ret) {
					// 因为循环引用，所以此时为 nil
					return
				}
				isLiteral = literal === ret
			}
			// 遍历 1-n 进行处理
			for (let i = 1, l = ts.length; i < l; i++) {
				ret = TypeDesc_prepare(ts[i], accepted, ret, mock, isLiteral, fieldName)
			}
			break
		}
		case Kind.primitive:
			if (isLiteral) {
				return TypeDesc_check(self, accepted, literal, 0, fieldName)
			}
			switch (self) {
				case int32:
					return mock ? (random() * 100) | 0 : 0
				case float64:
					return mock ? random() : 0
				case string:
					return mock ? random().toString(36).slice(2) : ''
			}
			// case bool:
			return mock ? random() < 0.5 : false
		case Kind.unknown:
			return isLiteral ? literal : void 0
	}
	return TypeDesc_prepare(self, accepted, ret, mock, isLiteral, fieldName)
}

function TypeDesc_proto(self: TypeDesc<unknown>): ProtoDesc {
	if (self[syl_kind] === Kind.decorate) {
		return TypeDesc_proto(self[syl_type][0])
	}
	let proto = self[syl_proto]
	if (proto) {
		return proto
	}
	proto = self[syl_proto] = <ProtoDesc>{
		[syl_type]: self,
		[syl_body]: {},
		[syl_proto]: {},
	}
	const { [syl_body]: body, [syl_proto]: descs } = proto
	let index = 0
	const bd = Object.freeze(self[syl_body])
	for (const k in bd) {
		body[k] = {
			index,
			type: bd[k],
		}
		descs[k] = propDef(index++)
	}
	if (!index) {
		throw Error('empty struct is invalid')
	}
	Object.setPrototypeOf(proto, self[syl_class].prototype)
	Object.freeze(proto)
	return proto
}

// 遍历定义结构字段
function TypeDesc_body(self: TypeDesc<unknown>, body: Record<string, unknown>) {
	let b = false
	const bd = (self[syl_body] = self[syl_body] || {})
	for (const k of Object.keys(body)) {
		if (k[0] !== '@') {
			if (!RE_identifier.test(k)) {
				throw Error(`field '${k}' is invalid`)
			}
			const v = body[k]
			if (!isTypeDesc(v)) {
				throw Error(`invalid field type for '${k}'`)
			}
			bd[k] = v
			b = true
		}
	}
	return b
}

function TypeDesc_define(
	desc: Record<string, unknown>,
	tdesc?: TypeDesc<unknown>
) {
	if (!isObject(desc)) {
		throw Error('description is invalid')
	}
	if (tdesc) {
		// 此处适用于: 先声明，后定义
		if (!isTypeDesc(tdesc) || tdesc[syl_kind] !== Kind.struct) {
			throw TypeError('type is not struct')
		}
		if (tdesc[syl_proto]) {
			throw Error('type is already defined')
		}
		TypeDesc_body(tdesc, desc)
		TypeDesc_proto(tdesc)
		return tdesc
	}
	const tt = <TypeDesc<unknown>>desc[at_type]
	if (tt && !isTypeDesc(tt)) {
		throw TypeError('type is wrong')
	}
	const name = <string>desc[at_name]
	if (name) {
		if (!isString(name) || !RE_name.test(name)) {
			throw Error('name is invalid')
		}
	}
	tdesc = <TypeDesc<unknown>>new TypeDesc()
	tdesc[syl_kind] = tt ? Kind.decorate : Kind.struct
	tdesc[syl_name] = name || ''
	tdesc[syl_type] = null!
	tdesc[syl_meta] = desc[at_notnil] ? Meta.notnil : 0
	tdesc[syl_mock] = toFunc(desc[at_mock], at_mock)
	tdesc[syl_value] = toFunc(desc[at_value], at_value)
	tdesc[syl_verify] = toFunc(desc[at_verify], at_verify)
	tdesc[syl_adjust] = toFunc(desc[at_adjust], at_adjust)
	tdesc[syl_assert] = toFunc(desc[at_assert], at_assert)
	tdesc[syl_init] = toFunc(desc[at_init], at_init)
	tdesc[syl_retain] = toFunc(desc[at_retain], at_retain)
	tdesc[syl_release] = toFunc(desc[at_release], at_release)
	if (tt) {
		tdesc[syl_type] =
			tt[syl_kind] === Kind.decorate ? tt[syl_type].concat(tt) : [tt]
		tdesc[syl_meta] |=
			tt[syl_meta] & Meta.adjust || tdesc[syl_adjust] ? Meta.adjust : 0
		tdesc[syl_meta] |=
			tt[syl_meta] & Meta.retain || tdesc[syl_retain] ? Meta.retain : 0
		tdesc[syl_meta] |=
			tt[syl_meta] & Meta.release || tdesc[syl_release] ? Meta.release : 0
		switch (TypeDesc_kind(tt)) {
			case Kind.unknown:
				// 如果原 type 是手动变更的，则之后的也是
				tdesc[syl_meta] |=
					tt[syl_meta] & Meta.change || desc[at_change] ? Meta.change : 0
				tdesc[syl_meta] |=
					tt[syl_meta] & Meta.noinit || desc[at_noinit] ? Meta.noinit : 0
				break
			case Kind.struct:
				tdesc[syl_meta] |=
					tt[syl_meta] & Meta.noinit || desc[at_noinit] ? Meta.noinit : 0
				tdesc[syl_accept] = new Set<TypeDesc<unknown>>(tdesc[syl_type]).add(
					tdesc
				)
				tdesc[syl_observers] = null!
				break
		}
	} else {
		tdesc[syl_meta] |= tdesc[syl_adjust] ? Meta.adjust : 0
		tdesc[syl_meta] |= tdesc[syl_retain] ? Meta.retain : 0
		tdesc[syl_meta] |= tdesc[syl_release] ? Meta.release : 0
		tdesc[syl_meta] |= desc[at_noinit] ? Meta.noinit : 0
		tdesc[syl_accept] = new Set<TypeDesc<unknown>>().add(tdesc)
		tdesc[syl_observers] = null!
		tdesc[syl_proto] = null!
		const c = <{ new (): unknown }>desc[at_class]
		if (c) {
			if (!isFunc(c)) {
				throw Error('class is invalid')
			}
			tdesc[syl_class] = c
		} else {
			tdesc[syl_class] = Struct
		}
		if (TypeDesc_body(tdesc, desc)) {
			TypeDesc_proto(tdesc)
		}
	}
	return Object.seal(tdesc)
}

function primitiveDesc<T>(
	name: string,
	kind: Kind = Kind.primitive
): TypeDesc<T> {
	const tdesc = <TypeDesc<T>>new TypeDesc()
	tdesc[syl_kind] = kind
	tdesc[syl_name] = name
	return Object.freeze(tdesc)
}

// primitive types
/**
 * @public
 */
export type bool = boolean | never
/**
 * @public
 */
export const bool = primitiveDesc<bool>('bool')
/**
 * @public
 */
export type int32 = number | (0 & never[])
/**
 * @public
 */
export const int32 = primitiveDesc<int32>('int32')
/**
 * @public
 */
export type float64 = number | (1 & never[])
/**
 * @public
 */
export const float64 = primitiveDesc<float64>('float64')
/**
 * @public
 */
export const string = primitiveDesc<string>('string')
/**
 * @public
 */
export const unknown = primitiveDesc<unknown>('unknown', Kind.unknown)

type keysof<T> = {
	[K in keyof T]: T[K] extends TypeDesc<unknown> ? Identifier<K> : never
}[keyof T]

type _typedef_<T> = T extends infer O
	? TypeDesc<
			O extends { [at_type]: infer U }
				? U extends TypeDesc<infer V>
					? V
					: never
				: Struct<{
						[K in keysof<O>]: O[K]
				  }>
	  >
	: never

/**
 * 定义一个新的类型描述
 *
 * @param desc  - 描述类型的规则和结构
 * @param tdesc - 适用于先声明空的 Struct，然后再定义全部字段
 * @returns 返回定义的 TypeDesc
 *
 * @example
 * ```ts
 * const Person = typedef({
 *   name: string,
 *   sex: bool,
 * })
 * ```
 *
 * @example
 * ```ts
 * // 类型别名
 * type Person = TypeDesc<Struct<{
 *   name: TypeDesc<string>
 *   sex: TypeDesc<bool>
 *   cosplay: Person
 * }>>
 * // 先声明空的 Struct
 * const Person: Person = typedef({})
 * typedef({
 *   name: string,
 *   sex: bool,
 *   cosplay: Person, // 自引用
 * }, Person)
 * ```
 *
 * @public
 */
export function typedef<T>(desc: Desc<T>, tdesc?: _typedef_<T>): _typedef_<T> {
	return <_typedef_<T>>TypeDesc_define(desc, tdesc)
}

type literal<T> = T extends Struct<StructType>
	? {
			[K in {
				[K in keyof T]: K extends string ? K : never
			}[keyof T]]?: literal<T[K]>
	  }
	: T

/**
 * @public
 */
export type typeinit<T extends TypeDesc<unknown>> = T extends TypeDesc<infer U>
	? U extends Struct<infer V>
		? V extends StructTypeDesc
			? Struct<{
					[K in keysof<U>]: U[K] extends infer O
						? O extends TypeDesc<unknown>
							? typeinit<O>
							: never
						: never
			  }>
			: never
		: U
	: never

/**
 * 从类型描述生成默认值
 *
 * @param tdesc   - 类型描述
 * @param literal - 指定明确的字面值
 * @returns 返回生成的值
 *
 * @example
 * ```ts
 * const Person = typedef({
 *   name: string,
 *   sex: bool,
 * })
 *
 * const Ron = typeinit(Person)
 * // result: { name: '', sex: false }
 * Ron.name = 'Ron'
 * // result: { name: 'Ron', sex: false }
 *
 * const Hermione = typeinit(Person, {
 *   name: 'Hermione',
 *   sex: true,
 * })
 * // result: { name: 'Hermione', sex: true }
 * ```
 *
 * @public
 */
export function typeinit<T extends TypeDesc<unknown>>(
	tdesc: T,
	literal?: literal<typeinit<T>>
): typeinit<T> {
	if (!isTypeDesc(tdesc)) {
		throw TypeError('type is wrong')
	}
	return <typeinit<T>>TypeDesc_init(tdesc, tdesc, literal, null!, false, '')
}

type _structbody_<T> = Readonly<T extends TypeDesc<Struct<infer U>> ? U : never>

/**
 * 返回结构体的所有字段
 *
 * @param tdesc - 结构体的类型描述
 * @returns 返回结构体的所有字段
 *
 * @public
 */
export function structbody<T extends TypeDesc<Struct<StructTypeDesc>>>(
	tdesc: T
): _structbody_<T> {
	if (!isTypeDesc(tdesc)) {
		throw TypeError('type is wrong')
	}
	if (tdesc[syl_kind] === Kind.decorate) {
		tdesc = <T>tdesc[syl_type][0]
	}
	if (tdesc[syl_kind] !== Kind.struct) {
		throw TypeError('type is not struct')
	}
	TypeDesc_proto(tdesc)
	return <_structbody_<T>>tdesc[syl_body]
}

/**
 * @public
 */
export type structof<T extends Struct<StructType>> = T extends Struct<infer U>
	? TypeDesc<
			Struct<{
				[K in keyof U]: U[K] extends Struct<StructType>
					? structof<U[K]>
					: TypeDesc<U[K]>
			}>
	  >
	: never

/**
 * 返回结构体实例的类型描述
 *
 * @param struct - 结构体实例
 * @returns 返回类型描述
 *
 * @public
 */
export function structof<T extends Struct<StructType>>(struct: T): structof<T> {
	if (!isStruct(struct)) {
		throw TypeError('type is not struct')
	}
	return <structof<T>>struct[syl_init]
}

interface ObserveFieldNodeDesc {
	name: string
	test: number
	bit: number
	index: number
	or: boolean
	diff: boolean
	notnil: boolean
	children?: ObserveFieldNodeDesc[]
	executor?: Function
}

interface ObserveNode {
	name: string // 字段名
	test: number // 目标条件校验值
	bitmap: number // children 的当前条件状态
	bit: number // 此节点所处的位
	index: number // virtual 的索引
	or: boolean // children 中是否只有一个变动即触发条件
	diff: boolean // 检查观察的字段值是否真正发生变化
	notnil: boolean // 字段值必须不为空
	children?: ObserveNode[] // 只有 struct 才会具有子节点
	parent?: ObserveNode
	executor?: Function // 待执行的规则（根节点）
	virtual: VirtualValue // 此节点引用的 virtual value
	running?: boolean // 规则执行时，标记运行状态，用来检测无限循环调用的错误
	[syl_outcome]?: any[] // 用来获取规则执行的结果（在规则执行前设置）
}

interface VirtualValue {
	name: string // 字段名
	value: unknown
	observers: Set<ObserveNode> // 附加的观察节点
	type: TypeDesc<unknown>
	dist: number // 可以向下分发的计数
	running: boolean // 标记状态，用于禁止递归赋值
}

function VirtualValue_set(
	self: VirtualValue,
	val: unknown,
	struct: Struct<StructType>
) {
	const { type: tdesc, value: oldVal, observers, name: fieldName } = self
	if (isWrapValue(val)) {
		const desc = (<WrapValue>val)[syl_desc]
		val = (<WrapValue>val)[syl_value]
		if (desc[at_diff] && oldVal === val) {
			return
		}
	}
	if (self.running) {
		throw Error(fieldError(fieldName, 'the last rule is not over yet'))
	}
	let diff = oldVal !== val
	if (diff || tdesc[syl_meta] & Meta.adjust) {
		self.value = val = TypeDesc_check(tdesc, tdesc, val, Flag.adjust, fieldName)
		diff = oldVal !== val
	}
	self.running = true
	const notnil = isNotnil(val)
	if (diff) {
		const { dist } = self
		if (dist) {
			let count = 0
			for (const n of observers) {
				if (n.children) {
					// 移除旧的观察者
					ObserveNode_remove(n)
					// 为新值分发观察者
					ObserveNode_distribute(n, self)
					if (++count === dist) {
						break
					}
				}
			}
		}
		if (tdesc[syl_meta] & Meta.change) {
			// 表示该类型可能会手动触发观察者
			if (isObject(oldVal)) {
				// 移除旧值的变更元素
				changeMap.get(oldVal)?.delete(self)
			}
			if (isObject(val)) {
				// 为新值注册变更元素
				if (!changeMap.has(val)) {
					changeMap.set(val, new Set<VirtualValue>())
				}
				changeMap.get(val)!.add(self)
			}
		}
		if (tdesc[syl_meta] & Meta.release && isNotnil(oldVal)) {
			if (tdesc[syl_kind] === Kind.decorate) {
				for (const t of tdesc[syl_type]) {
					t[syl_release]?.(oldVal, struct, fieldName)
				}
			}
			tdesc[syl_release]?.(oldVal, struct, fieldName)
		}
		if (tdesc[syl_meta] & Meta.retain && notnil) {
			if (tdesc[syl_kind] === Kind.decorate) {
				for (const t of tdesc[syl_type]) {
					t[syl_retain]?.(val, struct, fieldName)
				}
			}
			tdesc[syl_retain]?.(val, struct, fieldName)
		}
	}
	for (const n of observers) {
		if (!n.diff || diff) {
			if (!n.notnil || notnil) {
				if (n.children) {
					if (notnil && ObserveNode_check(n, notnil)) {
						ObserveNode_dispatch(n, fieldName)
					}
				} else {
					ObserveNode_dispatch(n, fieldName)
				}
			}
		}
	}
	self.running = false
}

function ObserveNode_dispatch(self: ObserveNode, fieldName: string) {
	self.bitmap = 0
	const { parent } = self
	if (parent) {
		parent.bitmap |= 1 << self.bit
		if (parent.bitmap === parent.test || parent.or) {
			ObserveNode_dispatch(parent, fieldName)
		}
		return
	}
	if (self.running) {
		throw Error(fieldError(fieldName, 'the last rule is not over yet'))
	}
	self.running = true
	const ret = self.executor!(self.virtual.value)
	const arr = self[syl_outcome]
	if (arr) {
		for (const v of arr) {
			v(ret)
		}
		arr.length = 0
	}
	self.running = false
}

function ObserveNode_check(self: ObserveNode, notnil: boolean) {
	const { children } = self
	if (children) {
		if (notnil) {
			let bitmap = 0
			const { test, or } = self
			for (const n of children) {
				if (!ObserveNode_check(n, isNotnil(n.virtual.value))) {
					return false
				}
				bitmap |= 1 << n.bit
				if (bitmap === test || or) {
					return true
				}
			}
		}
	} else if (!self.notnil || notnil) {
		return true
	}
	return false
}

// 分发观察者
function ObserveNode_distribute(self: ObserveNode, virtual: VirtualValue) {
	self.virtual = virtual
	virtual.observers.add(self)
	const val = virtual.value
	const { children } = self
	if (children) {
		virtual.dist++
		if (val) {
			const virtual = (<Struct<StructType>>val)[syl_virtual]
			for (const n of children) {
				ObserveNode_distribute(n, virtual[n.index])
			}
		}
	} else if (virtual.type[syl_meta] & Meta.change) {
		// 表示该类型可能会手动触发观察者
		if (isObject(val)) {
			// 为新值注册变更元素
			if (!changeMap.has(val)) {
				changeMap.set(val, new Set<VirtualValue>())
			}
			changeMap.get(val)!.add(virtual)
		}
	}
}

// 移除观察者
function ObserveNode_remove(self: ObserveNode) {
	const virtual: VirtualValue = self.virtual
	if (virtual) {
		virtual.observers.delete(self)
		self.virtual = null!
		self.bitmap = 0
		const { children } = self
		if (children) {
			virtual.dist--
			for (const n of children) {
				ObserveNode_remove(n)
			}
		} else if (virtual.type[syl_meta] & Meta.change) {
			// 表示该类型可能会手动触发观察者
			const val = virtual.value
			if (isObject(val)) {
				// 移除旧值的变更元素
				changeMap.get(val)!.delete(virtual)
			}
		}
	}
}

function ObserveNode_init(fn: ObserveFieldNodeDesc) {
	const node: ObserveNode = {
		name: fn.name,
		test: fn.test,
		bitmap: 0,
		bit: fn.bit,
		index: fn.index,
		or: fn.or,
		diff: fn.diff,
		notnil: fn.notnil,
		virtual: null!,
	}
	if (fn.children) {
		const children: ObserveNode[] = (node.children = [])
		for (const v of fn.children) {
			const n = ObserveNode_init(v)
			n.parent = node
			children.push(n)
		}
	}
	return node
}

function ObserveFieldNodeDesc_fields(
	tdesc: TypeDesc<unknown>,
	body: Record<string, unknown>,
	parent: ObserveFieldNodeDesc
) {
	if (tdesc[syl_kind] === Kind.decorate) {
		tdesc = tdesc[syl_type][0]
	}
	const children = []
	const bd = TypeDesc_proto(tdesc)[syl_body]
	let i = 0
	for (const k of Object.keys(body)) {
		if (k[0] !== '@') {
			const fd = bd[k]
			if (!fd) {
				throw Error(`field '${k}' is not found`)
			}
			parent.test |= 1 << i
			const node = ObserveFieldNodeDesc_init(
				fd.type,
				<Record<string, unknown>>body[k],
				k
			)
			node.bit = i
			node.index = fd.index
			children[i++] = node
		}
	}
	if (i) {
		if (i > 32) {
			throw Error(fieldError(parent.name, 'observed fields is greater than 32'))
		}
		parent.children = children
	}
	return i
}

function ObserveFieldNodeDesc_init(
	tdesc: TypeDesc<unknown>,
	body: Record<string, unknown>,
	name: string
) {
	const node: ObserveFieldNodeDesc = {
		name,
		test: 0,
		bit: 0,
		index: 0,
		or: false,
		diff: false,
		notnil: false,
	}
	if (isObject(body)) {
		node.diff = !!body[at_diff]
		node.notnil = !!body[at_notnil]
		if (TypeDesc_kind(tdesc) === Kind.struct) {
			node.or = !!body[at_or]
			if (!ObserveFieldNodeDesc_fields(tdesc, body, node)) {
				if (!(at_diff in body || at_notnil in body)) {
					throw Error(fieldError(name, 'observe has no fields'))
				}
			}
		} else if (!(at_diff in body || at_notnil in body)) {
			throw TypeError(fieldError(name, 'type is not struct'))
		}
	}
	return node
}

type ObserveDesc = {
	[at_notnil]?: true
	[at_diff]?: true
}

type ObserveField<T> = T extends TypeDesc<infer U>
	? U extends Struct<infer V>
		? V extends StructTypeDesc
			?
					| {
							[K in keysof<U>]?: ObserveField<U[K]>
					  }
					| {
							[at_or]?: true
					  }
					| ObserveDesc
					| true
			: never
		: ObserveDesc | true
	: never

type observe<T> = T extends TypeDesc<infer U>
	? {
			[K in keysof<U>]?: ObserveField<U[K]>
	  } & {
			[at_name]?: unknown
			[at_or]?: true
	  }
	: never

/**
 * 定义规则
 *
 * @param tdesc    - 类型描述
 * @param name     - 规则名
 * @param observe  - 描述需要观察的字段规则
 * @param executor - 当待观察的字段符合描述的规则时执行该规则
 *
 * @example
 * ```ts
 * const Person = typedef({
 *   name: string,
 *   sex: bool,
 *   intro: string,
 * })
 *
 * // 期望当名字、性别发生变化时，自动生成个人介绍
 * ruledef(
 *   Person,
 *   'generateIntroduction',
 *   {
 *     name: true,
 *     sex: true,
 *   },
 *   (self: typeinit<typeof Person>) => {
 *     self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
 *   }
 * )
 *
 * const myself = typeinit(Person)
 * myself.name = 'Amy'
 * myself.sex = true
 * // 此时，预期的名字、性别发生变化了，
 * // 将会自动执行规则，生成个人介绍。
 * console.log(myself.intro)
 * // output: My name is Amy, I am a girl.
 * ```
 *
 * @public
 */
export function ruledef<T extends TypeDesc<Struct<StructTypeDesc>>>(
	tdesc: T,
	name: unknown,
	observe: observe<T>,
	executor: (self: typeinit<T>) => unknown
): void {
	if (!isTypeDesc(tdesc)) {
		throw TypeError('type is wrong')
	}
	if (TypeDesc_kind(tdesc) !== Kind.struct) {
		throw TypeError('type is not struct')
	}
	TypeDesc_proto(tdesc)
	if (!isFunc(executor)) {
		throw Error('executor is invalid')
	}
	if (!isObject(observe)) {
		throw Error('observe is invalid')
	}
	if (at_name in observe) {
		name = observe[at_name]
	}
	if (!name) {
		throw Error('name is not defined')
	} else if ((!isString(name) && !isObject(name)) || isWrapValue(name)) {
		throw Error('name is invalid')
	}
	if (!tdesc[syl_observers]) {
		tdesc[syl_observers] = new Map<unknown, ObserveFieldNodeDesc>()
	}
	if (tdesc[syl_observers].has(name)) {
		throw Error(`rule '${name}' has already been defined`)
	} else if (tdesc[syl_kind] === Kind.decorate) {
		for (const v of tdesc[syl_type]) {
			if (v[syl_observers]?.has(name)) {
				throw Error(`rule '${name}' has already been defined`)
			}
		}
	}
	const fdesc = ObserveFieldNodeDesc_init(tdesc, observe, '')
	fdesc.executor = executor
	if (!fdesc.children) {
		throw Error('observe has no fields')
	}
	tdesc[syl_observers].set(name, fdesc)
}

/**
 * 获取预期规则执行的结果
 *
 * @param struct - 结构体实例
 * @param name   - 规则名，如果未指定则默认获取第一个规则
 * @returns 返回规则执行的结果 Promise
 *
 * @example
 * ```ts
 * // 期望当名字、性别发生变化时，自动生成个人介绍
 * ruledef(
 *   Person,
 *   'generateIntroduction',
 *   {
 *     name: true,
 *     sex: true,
 *   },
 *   (self: typeinit<typeof Person>) => {
 *     return self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
 *   }
 * )
 *
 * const myself = typeinit(Person)
 * // 先预期需要获取的结果
 * const asyncResult = outcome(myself, 'generateIntroduction')
 * myself.name = 'Amy'
 * myself.sex = true
 * // 此时，预期的名字、性别发生变化了，
 * // 将会自动执行规则，生成个人介绍。
 * console.log(await asyncResult)
 * // output: My name is Amy, I am a girl.
 * ```
 *
 * @public
 */
export function outcome(
	struct: Struct<StructType>,
	name?: unknown
): Promise<unknown> {
	if (!isStruct(struct)) {
		throw TypeError('type is not struct')
	}
	const node: ObserveNode = name
		? struct[syl_observers]?.get(name)
		: struct[syl_observers]?.values().next().value
	if (!node) {
		throw Error(`rule '${name}' is not defined`)
	}
	let arr: any = node[syl_outcome]
	if (!arr) {
		arr = node[syl_outcome] = []
		arr[syl_outcome] = function (resolve: unknown) {
			arr.push(resolve)
		}
	}
	return new Promise(arr[syl_outcome])
}

/**
 * 手动管理数据内部变动情况（适用于 Array Set Map 等）
 *
 * @param obj - 包含内部数据的任意对象
 *
 * @public
 */
export function change(obj: Record<any, any>): void {
	const set: Set<VirtualValue> = changeMap.get(obj)!
	if (set) {
		for (const v of set) {
			for (const n of v.observers) {
				if (!n.diff) {
					ObserveNode_dispatch(n, n.name)
				}
			}
		}
	}
}
