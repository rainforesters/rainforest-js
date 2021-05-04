# 类型描述

## 什么是类型描述

类型描述是：为类型添加描述规则，用来控制运行期间的行为。

类型的概念不再赘述。几乎所有语言都是由基本的几种类型构成的。

JavaScript 是动态语言，变量是没有类型的，然后有了 TypeScript 为变量表达类型。  
类型作为约束存在于静态检查期间，同样的，几乎所有的静态语言都会在编译期间进行类型擦除，类型的使命一般到此结束，不严格存在于运行期间。

可以看到，类型的主要作用就是在静态检查期间提供约束。

由于类型擦除，我们不能控制类型运行期间的行为，类型的意义被减弱了。  
比如，我们无法控制变量 `email: string` 只接收正确的字符串。
只能在接收到字符串后，再手动进行检查校验。
唯一的意义就是表明 `email` 只用于接收任何字符串，而不能是布尔、数值等其他类型的值。

所以，我们需要有一个在运行期间能够发挥效用的类型系统。  
类型描述，就是我们对此的实现，用来构造出这个有效的安全类型系统。

现在，我们可以**安全**的这样来使用了。

```ts
// 首先，定义一个新的类型描述
const Email = typedef({
  '@type': string, // 修饰原始的 string
  '@verify': (val: string) => {
    // 自定义校验
    // W3C Email Regex
    const RE = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    if (val && !RE.test(val)) {
      throw Error('Invalid email address.')
    }
  },
})

// 定义结构体
const MyStruct = typedef({
  email: Email,
})
// 实例化，然后设置邮箱
const myself = typeinit(MyStruct)
myself.email = 'amy@example.com' // It's ok.
myself.email = 'amy@example,com' // Throw the error.
```

这样就能保障我们的数据，总是正确的，符合预期的。  
也因此，让我们能安全的构造大型程序。

::: warning 提示
这里我们不考虑运行期间的类型反射。
:::

## 基本类型描述

系统原生提供了几个最基本的类型描述。  
这就足以用来描述整个世界了。  
因为，我们可以通过再次修饰，来修饰出多样化的各种类型描述。

| 基本类型描述 |   说明   |
| ------------ | :------: |
| unknown      | 未知类型 |
| bool         | 布尔类型 |
| int32        |   整型   |
| float64      |  浮点型  |
| string       |  字符串  |

比如，我们可以很容易的修饰出一个 `int8` 类型描述。

```ts
const int8 = typedef({
  '@type': int32,
  '@verify': (val: number) => {
    if (val < -128 || val >= 128) {
      throw TypeError('int8 overflow')
    }
  },
})
```

::: warning 提示
为方便阅读，后续的类型描述统一简称为类型。
:::

## Struct 类型

除了基本类型之外，我们提供了一个简单但强大的结构体类型。

**毫不客气的讲，这是数据结构化编程的灵魂。**

[我们在新的章节里详细学习它。](./struct)

## 定义新类型

使用 [typedef](/api/#typedef) 来定义一个新的类型。  
定义的新类型分为两种，一种是结构体，一种是对原有类型的再次修饰类型。

### 结构体

结构体就是由一个或多个字段组成的集合。

```ts
const MyStruct = typedef({
  name: string,
  sex: bool,
})
```

### 修饰类型

对一个已经定义好的类型再次进行修饰，就是一个修饰类型。

```ts
const int8 = typedef({
  '@type': int32,
})
```

可以看到，修饰类型和结构体的区别就是指定 [@type](./descriptors.html#type) 描述符来表明原有的类型。

当然了，我们也可以对结构体进行修饰。

```ts
const DecoratedStruct = typedef({
  '@type': MyStruct,
})
```

不过，需要注意的是，一旦结构体被定义，那么字段就固定下来了，所以不能在修饰中添加新的字段。  
这是因为，我们要保证原有结构体的确定性。  
因为该结构体可能会被多次修饰，所以我们需要保证在经过多次修饰后，该结构体还是原来的样子。
这样才能放心安全的的使用。

::: warning 注意
如果你熟悉继承，那么这里需要注意了，在这里没有任何的继承关系。  
如果你想扩展一个结构体，那么你应该重新定义一个新的结构体，采用组合的方式，将原结构体声明为一个字段。  
也正好，这种方式赋予了我们组合多个结构体的能力。并能保持简单清晰，这很有好处。
:::

## 初始化类型

使用 [typeinit](/api/#typeinit) 来初始化类型的值。  
主要用来初始化结构体。当然也可以直接初始化其他基本类型，但不常用。

初始化结构体时，所有字段都会自动初始化为类型的默认值。

```ts
const myself = typeinit(MyStruct)
console.log(myself)
// output: { name: '', sex: false }
```

我们也可以在初始化的同时为字段赋值。

```ts
const myself = typeinit(MyStruct, {
  name: 'Amy',
  sex: true,
})
```
