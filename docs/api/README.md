---
title: API
---

## 函数

### typedef

定义一个新的类型描述

**Signature:**

```ts
typedef<
  T extends Desc<T>
>(
  desc: T,
  tdesc?: _typedef_<T>
): _typedef_<T>
```

**Parameters:**

| Parameter | Type                 | Description                                 |
| --------- | -------------------- | ------------------------------------------- |
| desc      | T                    | 描述类型的规则和结构                        |
| tdesc     | \_typedef\_&lt;T&gt; | 适用于先声明空的 Struct，然后再定义全部字段 |

**Returns:** \_typedef\_&lt;T&gt;

**Example 1**

```ts
const Person = typedef({
  name: string,
  sex: bool,
})
```

**Example 2**

```ts
// 类型别名
type Person = TypeDesc<
  Struct<{
    name: TypeDesc<string>
    sex: TypeDesc<bool>
    cosplay: Person
  }>
>
// 先声明空的 Struct
const Person: Person = typedef({})
typedef(
  {
    name: string,
    sex: bool,
    cosplay: Person, // 自引用
  },
  Person
)
```

### typeinit

从类型描述生成默认值

**Signature:**

```ts
typeinit<
  T extends TypeDesc<unknown>
>(
  tdesc: T,
  literal?: literal<typeinit<T>>
): typeinit<T>
```

**Parameters:**

| Parameter | Type                             | Description      |
| --------- | -------------------------------- | ---------------- |
| tdesc     | T                                | 类型描述         |
| literal   | literal&lt;typeinit&lt;T&gt;&gt; | 指定明确的字面值 |

**Returns:** typeinit&lt;T&gt;

**Example**

```ts
const Person = typedef({
  name: string,
  sex: bool,
})

const Ron = typeinit(Person)
// result: { name: '', sex: false }
Ron.name = 'Ron'
// result: { name: 'Ron', sex: false }

const Hermione = typeinit(Person, {
  name: 'Hermione',
  sex: true,
})
// result: { name: 'Hermione', sex: true }
```

### structbody

返回结构体的所有字段

**Signature:**

```ts
structbody<
  T extends TypeDesc<
    Struct<Record<string, TypeDesc<unknown>>>
  >
>(
  tdesc: T
): _structbody_<T>
```

**Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| tdesc     | T    | 结构体的类型描述 |

**Returns:** \_structbody\_&lt;T&gt;

### structof

返回结构体实例的类型描述

**Signature:**

```ts
structof<
  T extends Struct<StructType>
>(
  struct: T
): structof<T>
```

**Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| struct    | T    | 结构体实例  |

**Returns:** structof&lt;T&gt;

### funcdef

定义函数

**Signature:**

```ts
funcdef<
  T extends TypeDesc<
    Struct<Record<string, TypeDesc<unknown>>>
  >
>(
  tdesc: T,
  name: unknown,
  observe: observe<T>,
  func: (self: typeinit<T>) => unknown
): void
```

**Parameters:**

| Parameter | Type                                    | Description                              |
| --------- | --------------------------------------- | ---------------------------------------- |
| tdesc     | T                                       | 类型描述                                 |
| name      | unknown                                 | 函数名                                   |
| observe   | observe&lt;T&gt;                        | 描述需要观察的字段规则                   |
| func      | (self: typeinit&lt;T&gt;) =&gt; unknown | 当待观察的字段符合描述的规则时触发该函数 |

**Returns:** void

**Example**

```ts
const Person = typedef({
  name: string,
  sex: bool,
  intro: string,
})

// 期望当名字、性别发生变化时，自动生成个人介绍
funcdef(
  Person,
  'generateIntroduction',
  {
    name: true,
    sex: true,
  },
  (self: typeinit<typeof Person>) => {
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
  }
)

const myself = typeinit(Person)
myself.name = 'Amy'
myself.sex = true
// 此时，预期的名字、性别发生变化了，
// 将会自动执行函数，生成个人介绍。
console.log(myself.intro)
// output: My name is Amy, I am a girl.
```

### outcome

获取预期函数结果

**Signature:**

```ts
outcome(
  struct: Struct<StructType>,
  name?: unknown
): Promise<unknown>
```

**Parameters:**

| Parameter | Type                     | Description                            |
| --------- | ------------------------ | -------------------------------------- |
| struct    | Struct&lt;StructType&gt; | 结构体实例                             |
| name      | unknown                  | 函数名，如果未指定则默认获取第一个函数 |

**Returns:** Promise&lt;unknown&gt;

**Example**

```ts
// 期望当名字、性别发生变化时，自动生成个人介绍
funcdef(
  Person,
  'generateIntroduction',
  {
    name: true,
    sex: true,
  },
  (self: typeinit<typeof Person>) => {
    return (self.intro = `My name is ${self.name}, I am a ${
      self.sex ? 'girl' : 'boy'
    }.`)
  }
)

const myself = typeinit(Person)
// 先预期需要获取的结果
const asyncResult = outcome(myself, 'generateIntroduction')
myself.name = 'Amy'
myself.sex = true
// 此时，预期的名字、性别发生变化了，
// 将会自动执行函数，生成个人介绍。
console.log(await asyncResult)
// output: My name is Amy, I am a girl.
```

### change

手动管理数据内部变动情况（适用于 Array Set Map 等）

**Signature:**

```ts
change(
  obj: Record<any, any>
): void
```

**Parameters:**

| Parameter | Type                   | Description            |
| --------- | ---------------------- | ---------------------- |
| obj       | Record&lt;any, any&gt; | 包含内部数据的任意对象 |

**Returns:** void

### wrapval

使用描述来包装值

**Signature:**

```ts
wrapval<
  T
>(
  desc: Record<string, unknown>,
  val?: T
): Readonly<T>
```

**Parameters:**

| Parameter | Type                          | Description |
| --------- | ----------------------------- | ----------- |
| desc      | Record&lt;string, unknown&gt; | 描述说明    |
| val       | T                             | 被包装的值  |

**Returns:** Readonly&lt;T&gt;

## 基本类型

### unknown

### bool

### int32

### float64

### string

## Struct

结构体就是由一个或多个字段组成的集合。  
这是一个抽象的类型，需要定义新的结构体才行。

## 内置类型

### object

### array

### CArray

使用 [change](#change) 和 `Proxy` 实现的自动同步元素变更的数组。
