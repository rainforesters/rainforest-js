---
title: API
---

## 函数

### typedef

定义一个新的类型描述

**Signature:**

```ts
typedef(desc: any, tdesc?: TypeDesc): TypeDesc
```

**Parameters:**

| Parameter | Type     | Description                                 |
| --------- | -------- | ------------------------------------------- |
| desc      | any      | 描述类型的规则和结构                        |
| tdesc     | TypeDesc | 适用于先声明空的 Struct，然后再定义全部字段 |

**Returns:** TypeDesc

**Example 1**

```ts
const Person = typedef({
  name: string,
  sex: bool,
})
```

**Example 2**

```ts
// 先声明空的 Struct
const Person = typedef({})
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
typeinit(tdesc: TypeDesc, literal?: any): any
```

**Parameters:**

| Parameter | Type     | Description      |
| --------- | -------- | ---------------- |
| tdesc     | TypeDesc | 类型描述         |
| literal   | any      | 指定明确的字面值 |

**Returns:** any

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
structbody(tdesc: TypeDesc): Record<string, TypeDesc>
```

**Parameters:**

| Parameter | Type     | Description      |
| --------- | -------- | ---------------- |
| tdesc     | TypeDesc | 结构体的类型描述 |

**Returns:** Record&lt;string, TypeDesc&gt;

### structof

返回结构体实例的类型描述

**Signature:**

```ts
structof(struct: Struct): TypeDesc
```

**Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| struct    | Struct | 结构体实例  |

**Returns:** TypeDesc

### funcdef

定义函数

**Signature:**

```ts
funcdef(
  tdesc: TypeDesc,
  name: any,
  observe: any,
  func: Function
): void
```

**Parameters:**

| Parameter | Type     | Description                              |
| --------- | -------- | ---------------------------------------- |
| tdesc     | TypeDesc | 类型描述                                 |
| name      | any      | 函数名                                   |
| observe   | any      | 描述需要观察的字段规则                   |
| func      | Function | 当待观察的字段符合描述的规则时触发该函数 |

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
  (self: Struct) => {
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
outcome(struct: Struct, name?: any): Promise<unknown>
```

**Parameters:**

| Parameter | Type   | Description                            |
| --------- | ------ | -------------------------------------- |
| struct    | Struct | 结构体实例                             |
| name      | any    | 函数名，如果未指定则默认获取第一个函数 |

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
  (self: Struct) => {
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
change(obj: any): void
```

**Parameters:**

| Parameter | Type | Description            |
| --------- | ---- | ---------------------- |
| obj       | any  | 包含内部数据的任意对象 |

**Returns:** void

### wrapval

使用描述来包装值

**Signature:**

```ts
wrapval(desc: any, val?: any): any
```

**Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| desc      | any  | 描述说明    |
| val       | any  | 被包装的值  |

**Returns:** any

## 基本类型

### any

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
