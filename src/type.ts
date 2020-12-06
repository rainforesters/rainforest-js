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
	syl_init = Symbol('init'),
	syl_retain = Symbol('retain'),
	syl_release = Symbol('release'),
	syl_noinit = Symbol('noinit'),
	syl_notnil = Symbol('notnil'),
	syl_change = Symbol('change'),
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
			enumerable: true,
			get: function () {
				return this[syl_virtual][index].value
			},
			set: function (val: any) {
				VirtualValue_set(this[syl_virtual][index], val, this)
			},
		}
	)
}

function hideProp<T>(obj: any, key: string | number | symbol, value: T): T {
	Object.defineProperty(obj, key, {
		value,
	})
	return value
}

function toFunc(f: Function, msg: string): Function {
	if (f) {
		if (!isFunc(f)) {
			throw Error(`${msg} is not a function`)
		}
		return f
	}
	return null!
}

function isFunc(v: any): v is Function {
	return typeof v === 'function'
}

function isString(v: any): v is string {
	return typeof v === 'string'
}

function isObject(v: any): boolean {
	return null !== v && typeof v === 'object'
}

function isNotnil(v: any): boolean {
	return null !== v && void 0 !== v
}

interface WrapValue {
	[syl_wrap]: true
	[syl_desc]: any
	[syl_value]: any
}

function isWrapValue(v: any): v is WrapValue {
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
export function wrapval(desc: any, val?: any): any {
	if (!isObject(desc)) {
		throw TypeError('description is invalid')
	}
	if (isWrapValue(val)) {
		throw Error('cannot wrap the already wrapped value')
	}
	return {
		[syl_wrap]: true,
		[syl_desc]: desc,
		[syl_value]: val,
	}
}

interface ProtoDesc {
	[syl_type]: TypeDesc
	[syl_body]: Record<string, FieldDesc> // 可以直接访问的字段集合
	[syl_proto]: Record<string, any>
}

interface FieldDesc {
	type: TypeDesc // 字段类型
	index: number // 字段索引偏移
}

const enum Kind {
	any,
	primitive,
	struct,
	decorate,
}

interface _TypeDesc {
	[syl_name]: string
	[syl_kind]: Kind
	[syl_type]: TypeDesc[] // 待修饰的类型描述链
	[syl_mock]: Function // 实例化时返回模拟数据
	[syl_value]: Function // 实例化时返回默认数据
	[syl_verify]: Function // 对数据进行校验
	[syl_adjust]: Function // 对数据进行修正
	[syl_init]: Function // 对数据进行初始化
	[syl_retain]: Function // 被 struct 引用时调用
	[syl_release]: Function // 从 struct 中移除时调用
	[syl_noinit]: boolean // 禁用自动实例化，只能手动实例化
	[syl_notnil]: boolean // 不允许为空
	[syl_change]: boolean // 标记会手动管理数据内部变动情况（适用于 Array Set Map 等）

	[syl_body]: Record<string, TypeDesc> // struct 字段集合
	[syl_observers]: Map<any, ObserveFieldNodeDesc> // 注册的函数集合
	[syl_accept]: Set<TypeDesc> // 能够认可的类型描述集合
	[syl_proto]: ProtoDesc // struct 原型描述
	[syl_class]: FunctionConstructor
}

/**
 * @public
 */
export interface TypeDesc extends _TypeDesc {}

const TypeDesc = class TypeDesc {}

interface _Struct {
	[k: string]: any
	[syl_virtual]: VirtualValue[] // 虚拟字段值
	[syl_observers]: Map<any, ObserveNode>
	[syl_init]: TypeDesc // 初始化时的类型描述（可能是修饰后的类型描述）

	[syl_type]: TypeDesc
}

/**
 * @public
 */
export interface Struct extends _Struct {}

const Struct = class Struct {}

function isStruct(v: any): v is Struct {
	return isObject(v) && syl_virtual in v
}

function isTypeDesc(v: any): v is TypeDesc {
	return isObject(v) && syl_kind in v
}

function TypeDesc_kind(self: TypeDesc) {
	const kind = self[syl_kind]
	return kind === Kind.decorate ? self[syl_type][0][syl_kind] : kind
}

const enum Flag {
	adjust = 1, // 对数据进行修正
	self = 2, // 只校验当前自身的类型描述
}

function TypeDesc_check(
	self: TypeDesc,
	accepted: TypeDesc,
	val: any,
	flag: Flag
) {
	switch (self[syl_kind]) {
		case Kind.struct:
			if (isNotnil(val)) {
				if (!isStruct(val)) {
					throw TypeError('expected struct')
				}
				if (!val[syl_init][syl_accept].has(accepted)) {
					if (val[syl_type] !== self) {
						throw TypeError('type mismatch')
					}
					throw TypeError('decorate mismatch')
				}
			} else if (self[syl_notnil]) {
				throw Error('must not be nil')
			}
			self[syl_verify]?.(val)
			if (flag & Flag.adjust && self[syl_adjust]) {
				val = TypeDesc_check2(self, accepted, val, 0, syl_adjust)
			}
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
				val = TypeDesc_check(ts[0], accepted, val, flag)
			}
			let b = true
			let t: TypeDesc
			// 按顺序校验类型描述链
			do {
				if (i < l) {
					t = ts[i++]
				} else {
					t = self
					b = false
				}
				if (t[syl_notnil] && !isNotnil(val)) {
					throw Error('must not be nil')
				}
				t[syl_verify]?.(val)
				if (flag & Flag.adjust && t[syl_adjust]) {
					val = TypeDesc_check2(t, accepted, val, 0, syl_adjust)
				}
			} while (b)
			break
		}
		case Kind.primitive: {
			const t = typeof val
			switch (self) {
				case int32:
					if (t !== 'number' || val !== (val | 0)) {
						throw TypeError('expected int32')
					}
					break
				case float64:
					if (t !== 'number') {
						throw TypeError('expected float64')
					}
					break
				case string:
					if (t !== 'string') {
						throw TypeError('expected string')
					}
					break
				case bool:
					if (t !== 'boolean') {
						throw TypeError('expected bool')
					}
					break
			}
			break
		}
	}
	return val
}

function TypeDesc_check2(
	self: TypeDesc,
	accepted: TypeDesc,
	val: any,
	flag: Flag,
	syl: typeof syl_mock | typeof syl_value | typeof syl_adjust
) {
	const newVal = self[syl](val)
	if (val !== newVal || isObject(newVal)) {
		val = TypeDesc_check(self, accepted, newVal, flag)
	}
	return val
}

function TypeDesc_prepare(
	self: TypeDesc,
	accepted: TypeDesc,
	val: any,
	mock: boolean,
	isLiteral: boolean
): any {
	if (isLiteral) {
		return TypeDesc_check(self, accepted, val, Flag.adjust | Flag.self)
	}
	if (mock && self[syl_mock]) {
		val = TypeDesc_check2(self, accepted, val, Flag.adjust, syl_mock)
	} else if (self[syl_value]) {
		val = TypeDesc_check2(self, accepted, val, Flag.adjust, syl_value)
	} else {
		val = TypeDesc_check(self, accepted, val, Flag.adjust | Flag.self)
	}
	if (isNotnil(val)) {
		if (self[syl_observers]) {
			// 如果有观察者，则构造观察者结构
			const struct = <Struct>val
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
				}
				map = hideProp(struct, syl_observers, new Map<string, ObserveNode>())
			}
			for (const [k, v] of self[syl_observers]) {
				const node = ObserveNode_init(v)
				node.func = v.func
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
	self: TypeDesc,
	accepted: TypeDesc,
	literal: any,
	circular: Set<TypeDesc>,
	mock: boolean
): any {
	let isLiteral = false
	if (void 0 !== literal) {
		if (isWrapValue(literal)) {
			const desc = literal[syl_desc]
			literal = literal[syl_value]
			if (at_mock in desc) {
				mock = desc[at_mock]
			} else if (void 0 !== literal) {
				isLiteral = true
			}
		} else {
			isLiteral = true
		}
	}
	let ret: any
	switch (self[syl_kind]) {
		case Kind.struct: {
			if (null === literal) {
				return literal
			}
			if (isStruct(literal)) {
				ret = literal
				isLiteral = true
				break
			}
			if (void 0 !== literal) {
				if (!isObject(literal)) {
					throw Error('expected struct')
				}
				isLiteral = false
			}
			if (!circular) {
				circular = new Set<TypeDesc>()
			} else if (circular.has(self)) {
				const ts = accepted[syl_type]
				const l = ts ? ts.length : 0
				let i = 0
				let b = true
				let t: TypeDesc
				do {
					if (i < l) {
						t = ts[i++]
					} else {
						t = accepted
						b = false
					}
					if (t[syl_notnil]) {
						// 因为循环引用，所以此时为 nil
						console.warn(
							'This will form a circular reference, so it must be nil.'
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
				const v =
					t[syl_noinit] && void 0 === l
						? l
						: TypeDesc_init(t, t, l, circular, mock)
				virtual.push({
					name: k,
					value: v,
					observers: new Set<ObserveNode>(),
					type: t,
					dist: 0,
				})
				if (t[syl_retain] && isNotnil(v)) {
					t[syl_retain](v, ret, k)
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
				mock
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
				ret = TypeDesc_prepare(ts[i], accepted, ret, mock, isLiteral)
			}
			break
		}
		case Kind.primitive:
			if (isLiteral) {
				return TypeDesc_check(self, accepted, literal, 0)
			}
			switch (self) {
				case int32:
					return mock ? (random() * 100) | 0 : 0
				case float64:
					return mock ? random() : 0
				case string:
					return mock ? 'hello rainforest' : ''
			}
			// case bool:
			return mock ? random() > 0.5 : false
		case Kind.any:
			return isLiteral ? literal : void 0
	}
	return TypeDesc_prepare(self, accepted, ret, mock, isLiteral)
}

function TypeDesc_proto(self: TypeDesc): ProtoDesc {
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
	const bd = self[syl_body]
	for (const k in bd) {
		body[k] = {
			index,
			type: bd[k],
		}
		descs[k] = propDef(index++)
	}
	Object.defineProperties(proto, descs)
	Object.setPrototypeOf(proto, self[syl_class].prototype)
	Object.freeze(proto)
	return proto
}

// 遍历定义结构字段
function TypeDesc_body(self: TypeDesc, body: any) {
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

function TypeDesc_define(desc: any, tdesc?: TypeDesc) {
	if (!isObject(desc)) {
		throw Error('desc is invalid')
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
	const tt = desc[at_type]
	if (tt && !isTypeDesc(tt)) {
		throw TypeError('type is wrong')
	}
	const name: string = desc[at_name]
	if (name) {
		if (!isString(name) || !RE_name.test(name)) {
			throw Error('name is invalid')
		}
		tdesc = <TypeDesc>(<any>new (defineClass(name, TypeDesc))())
	} else {
		tdesc = <TypeDesc>new TypeDesc()
	}
	tdesc[syl_kind] = tt ? Kind.decorate : Kind.struct
	tdesc[syl_name] = name || ''
	tdesc[syl_type] = null!
	tdesc[syl_noinit] = false
	tdesc[syl_notnil] = !!desc[at_notnil]
	tdesc[syl_change] = false
	tdesc[syl_mock] = toFunc(desc[at_mock], at_mock)
	tdesc[syl_value] = toFunc(desc[at_value], at_value)
	tdesc[syl_verify] = toFunc(desc[at_verify], at_verify)
	tdesc[syl_adjust] = toFunc(desc[at_adjust], at_adjust)
	tdesc[syl_init] = toFunc(desc[at_init], at_init)
	tdesc[syl_retain] = toFunc(desc[at_retain], at_retain)
	tdesc[syl_release] = toFunc(desc[at_release], at_release)
	if (tt) {
		tdesc[syl_type] =
			tt[syl_kind] === Kind.decorate ? tt[syl_type].concat(tt) : [tt]
		switch (TypeDesc_kind(tt)) {
			case Kind.any:
				// 如果原 type 是手动变更的，则之后的也是
				tdesc[syl_change] = tt[syl_change] || !!desc[at_change]
				tdesc[syl_noinit] = tt[syl_noinit] || !!desc[at_noinit]
				break
			case Kind.struct:
				tdesc[syl_noinit] = tt[syl_noinit] || !!desc[at_noinit]
				tdesc[syl_accept] = new Set<TypeDesc>(tdesc[syl_type]).add(tdesc)
				break
		}
	} else {
		tdesc[syl_noinit] = !!desc[at_noinit]
		tdesc[syl_accept] = new Set<TypeDesc>().add(tdesc)
		const c = desc[at_class]
		if (c) {
			if (!isFunc(c)) {
				throw Error('class is invalid')
			}
			tdesc[syl_class] = c
		} else {
			tdesc[syl_class] = name ? defineClass(name, Struct) : <any>Struct
		}
		if (TypeDesc_body(tdesc, desc)) {
			TypeDesc_proto(tdesc)
		}
	}
	return tdesc
}

function defineClass(name: string, type: Function): FunctionConstructor {
	const c = new Function(`return function ${name}() {}`)()
	c.prototype = type.prototype
	return c
}

function primitiveDesc(name: string) {
	const tdesc: TypeDesc = <any>new (defineClass(name, TypeDesc))()
	tdesc[syl_kind] = Kind.primitive
	tdesc[syl_name] = name
	return tdesc
}

// primitive types
/**
 * @public
 */
export const bool = primitiveDesc('bool')
/**
 * @public
 */
export const int32 = primitiveDesc('int32')
/**
 * @public
 */
export const float64 = primitiveDesc('float64')
/**
 * @public
 */
export const string = primitiveDesc('string')
/**
 * @public
 */
export const any = primitiveDesc('any')
any[syl_kind] = Kind.any

/**
 * 定义一个新的类型描述
 *
 * @param desc  - 描述类型的规则和结构
 * @param tdesc - 适用于先声明空的 Struct，然后再定义全部字段
 * @returns 返回定义的 TypeDesc
 *
 * @example
 * ```
 * const Person = typedef({
 *   name: string,
 *   sex: bool,
 * })
 * ```
 *
 * @example
 * ```
 * // 先声明空的 Struct
 * const Person = typedef({})
 * typedef({
 *   name: string,
 *   sex: bool,
 *   cosplay: Person, // 自引用
 * }, Person)
 * ```
 *
 * @public
 */
export function typedef(desc: any, tdesc?: TypeDesc): TypeDesc {
	return TypeDesc_define(desc, tdesc)
}

/**
 * 从类型描述生成默认值
 *
 * @param tdesc   - 类型描述
 * @param literal - 指定明确的字面值
 * @returns 返回生成的值
 *
 * @example
 * ```
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
export function typeinit(tdesc: TypeDesc, literal?: any): any {
	if (!isTypeDesc(tdesc)) {
		throw TypeError('type is wrong')
	}
	return TypeDesc_init(tdesc, tdesc, literal, null!, false)
}

/**
 * 返回结构体的所有字段
 *
 * @param tdesc - 结构体的类型描述
 * @returns 返回结构体的所有字段
 *
 * @public
 */
export function structbody(tdesc: TypeDesc): Record<string, TypeDesc> {
	if (!isTypeDesc(tdesc)) {
		throw TypeError('type is wrong')
	}
	if (tdesc[syl_kind] === Kind.decorate) {
		tdesc = tdesc[syl_type][0]
	}
	if (tdesc[syl_kind] !== Kind.struct) {
		throw TypeError('type is not struct')
	}
	TypeDesc_proto(tdesc)
	return tdesc[syl_body]
}

/**
 * 返回结构体实例的类型描述
 *
 * @param struct - 结构体实例
 * @returns 返回类型描述
 *
 * @public
 */
export function structof(struct: Struct): TypeDesc {
	if (!isStruct(struct)) {
		throw TypeError('type is not struct')
	}
	return struct[syl_init]
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
	func?: Function
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
	func?: Function // 待触发的函数（根节点）
	virtual: VirtualValue // 此节点引用的 virtual value
	running?: boolean // 函数触发时，标记运行状态，用来检测无限循环调用的错误
	[syl_outcome]?: any[] // 用来获取函数结果（在函数执行前设置）
}

interface VirtualValue {
	name: string // 字段名
	value: any
	observers: Set<ObserveNode> // 附加的观察节点
	type: TypeDesc
	dist: number // 可以向下分发的计数
}

function VirtualValue_set(self: VirtualValue, val: any, struct: Struct) {
	const { type: tdesc, value: oldVal, observers } = self
	if (isWrapValue(val)) {
		val = (<WrapValue>val)[syl_value]
	}
	let diff = oldVal !== val
	if (diff || tdesc[syl_adjust]) {
		self.value = val = TypeDesc_check(tdesc, tdesc, val, Flag.adjust)
		diff = oldVal !== val
	}
	const notnil = isNotnil(val)
	if (diff) {
		const { name, dist } = self
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
		if (tdesc[syl_change]) {
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
		if (tdesc[syl_release] && isNotnil(oldVal)) {
			tdesc[syl_release](oldVal, struct, name)
		}
		if (tdesc[syl_retain] && notnil) {
			tdesc[syl_retain](val, struct, name)
		}
	}
	for (const n of observers) {
		if (!n.diff || diff) {
			if (!n.notnil || notnil) {
				if (n.children && notnil) {
					if (!ObserveNode_check(n, notnil)) {
						continue
					}
				}
				ObserveNode_dispatch(n)
			}
		}
	}
}

function ObserveNode_dispatch(self: ObserveNode) {
	self.bitmap = 0
	const { parent } = self
	if (parent) {
		parent.bitmap |= 1 << self.bit
		if (parent.bitmap === parent.test || parent.or) {
			ObserveNode_dispatch(parent)
		}
		return
	}
	if (self.running) {
		throw Error('infinite loop')
	}
	self.running = true
	const ret = self.func!(self.virtual.value)
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
	if (children && notnil) {
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
			const virtual = val[syl_virtual]
			for (const n of children) {
				ObserveNode_distribute(n, virtual[n.index])
			}
		}
	} else if (virtual.type[syl_change]) {
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
		} else if (virtual.type[syl_change]) {
			// 表示该类型可能会手动触发观察者
			const val = virtual.value
			if (isObject(val)) {
				// 移除旧值的变更元素
				changeMap.get(val)?.delete(virtual)
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
	tdesc: TypeDesc,
	body: any,
	parent: ObserveFieldNodeDesc,
	offset: number
) {
	if (tdesc[syl_kind] === Kind.decorate) {
		tdesc = tdesc[syl_type][0]
	}
	const children = parent.children!
	const proto = TypeDesc_proto(tdesc)
	const bd = proto[syl_body]
	for (const k of Object.keys(body)) {
		if (k[0] !== '@') {
			const fd = bd[k]
			if (!fd) {
				throw Error(`field '${k}' is not found`)
			}
			parent.test |= 1 << children.length
			const node = ObserveFieldNodeDesc_init(fd.type, body[k], k)
			node.bit = children.length
			node.index = offset + fd.index
			children.push(node)
		}
	}
}

function ObserveFieldNodeDesc_init(tdesc: TypeDesc, body: any, name: string) {
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
			const children = (node.children = [])
			ObserveFieldNodeDesc_fields(tdesc, body, node, 0)
			const len = children.length
			if (!len) {
				node.children = null!
			} else if (len > 32) {
				throw Error('observed fields is greater than 32')
			}
		} else if (!(at_diff in body || at_notnil in body)) {
			throw TypeError('type is not struct')
		}
	}
	return node
}

/**
 * 定义函数
 *
 * @param tdesc   - 类型描述
 * @param name    - 函数名
 * @param observe - 描述需要观察的字段规则
 * @param func    - 当待观察的字段符合描述的规则时触发该函数
 *
 * @example
 * ```
 * const Account = typedef({
 *   username: string,
 *   password: string,
 *   logined: bool,
 * })
 *
 * // 当用户名和密码都变更时，触发登录函数
 * funcdef(Account, 'login', {
 *   username: true,
 *   password: true,
 * }, (account: Struct) => {
 *   account.logined = true
 * })
 *
 * const account = typeinit(Account)
 * account.username = 'Ron'
 * account.password = '***'
 * // 条件已经符合，自动执行登录
 * // result: account.logined === true
 * ```
 *
 * @public
 */
export function funcdef(
	tdesc: TypeDesc,
	name: any,
	observe: any,
	func: Function
): void {
	if (!isTypeDesc(tdesc)) {
		throw TypeError('type is wrong')
	}
	if (TypeDesc_kind(tdesc) !== Kind.struct) {
		throw TypeError('type is not struct')
	}
	TypeDesc_proto(tdesc)
	if (!isFunc(func)) {
		throw Error('func is invalid')
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
		tdesc[syl_observers] = new Map<any, ObserveFieldNodeDesc>()
	}
	if (tdesc[syl_observers].has(name)) {
		throw Error(`func '${name}' has already been defined`)
	} else if (tdesc[syl_kind] === Kind.decorate) {
		for (const v of tdesc[syl_type]) {
			if (v[syl_observers]?.has(name)) {
				throw Error(`func '${name}' has already been defined`)
			}
		}
	}
	const fdesc = ObserveFieldNodeDesc_init(tdesc, observe, '')
	fdesc.func = func
	if (!fdesc.children) {
		throw Error('observe has no fields')
	}
	tdesc[syl_observers].set(name, fdesc)
}

/**
 * 获取预期函数结果
 *
 * @param struct - 结构体实例
 * @param name   - 函数名，如果未指定则默认获取第一个函数
 * @returns 返回函数结果的 Promise
 *
 * @example
 * ```
 * // 当用户名和密码都变更时，自动执行登录
 * funcdef(Account, 'login', {
 *   username: true,
 *   password: true,
 * }, (account: Struct) => {
 *   return `Hello ${account.username}!`
 * })
 *
 * const account = typeinit(Account)
 * // 先预期需要获取的结果
 * const asyncResult = outcome(account, 'login')
 * account.username = 'Ron'
 * account.password = '***'
 * // 条件已经符合，自动执行登录
 * await asyncResult
 * // result: Hello Ron!
 * ```
 *
 * @public
 */
export function outcome(struct: Struct, name?: any): Promise<unknown> {
	if (!isStruct(struct)) {
		throw TypeError('type is not struct')
	}
	const node: ObserveNode = name
		? struct[syl_observers]?.get(name)
		: struct[syl_observers]?.values().next().value
	if (!node) {
		throw Error(`func '${name}' is not defined`)
	}
	let arr: any = node[syl_outcome]
	if (!arr) {
		arr = node[syl_outcome] = []
		arr[syl_outcome] = function (resolve: any) {
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
export function change(obj: any): void {
	const set: Set<VirtualValue> = changeMap.get(obj)!
	if (set) {
		for (const v of set) {
			for (const n of v.observers) {
				ObserveNode_dispatch(n)
			}
		}
	}
}
