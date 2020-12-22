# Struct 类型

这是一个简单又内涵丰富的类型。  
简单来讲，是由一个或多个字段组成的集合。  
**毫不客气的讲，这是数据结构化编程的灵魂。**

## 初识

我们可以很方便的定义它。

```ts
const MyStruct = typedef({
  name: string,
  sex: bool,
})
```

类型定义之后，我们需要初始化其实例，就可以使用了。  
初始化结构体时，所有字段都会自动初始化为类型的默认值。

```ts
const myself = typeinit(MyStruct)
console.log(myself)
// output: { name: '', sex: false }

myself.name = 'Amy'
myself.sex = true
```

这样，我们就得到了由安全字段类型组成的结构体实例。  
之后为字段的每次赋值都自动校验，这样就保障了整体的安全性。

我们也可以在初始化的同时为字段赋值。

```ts
const myself = typeinit(MyStruct, {
  name: 'Amy',
  sex: true,
})
```

另一个好用的是，我们可以直接初始化完整的结构体，包括子结构体。

```ts
const Contact = typedef({
  phone: string,
  email: string,
})
const MyStruct = typedef({
  name: string,
  sex: bool,
  contact: Contact,
})
const myself = typeinit(MyStruct)
console.log(myself)
// output: { name: '', sex: false, contact: { phone: '', email: '' } }
```

如果不想初始化子结构体，那么也很容易。或者使用 [@noinit](#noinit) 描述符。

```ts
const myself = typeinit(MyStruct, {
  contact: null,
})
console.log(myself)
// output: { name: '', sex: false, contact: null }
```

## 模拟数据

由于我们日常编程中，经常需要用到模拟数据。  
所以借助于前面学习的 [@mock](./descriptors.html#mock) 描述符，我们可以很容易的生成模拟数据。

```ts
const MyStruct = typedef({
  name: typedef({
    '@type': string,
    '@mock': () => (Math.random() > 0.5 ? 'Amy' : 'Ron'),
  }),
  sex: typedef({
    '@type': bool,
    '@mock': () => Math.random() > 0.5,
  }),
  age: typedef({
    '@type': int32,
    '@mock': () => (Math.random() * 100 + 1) | 0,
  }),
})

// 我们使用 wrapval({ '@mock': true }) 来生成模拟的数据
const myself = typeinit(MyStruct, wrapval({ '@mock': true }))
```

如果我们并不想模拟全部字段，那么可以在初始化的同时为字段赋值。

```ts
const myself = typeinit(
  MyStruct,
  wrapval(
    { '@mock': true },
    {
      name: 'Amy',
      sex: true,
    }
  )
)
```

或者仅在某些字段上模拟。

```ts
const myself = typeinit(MyStruct, {
  name: 'Amy',
  sex: true,
  age: wrapval({ '@mock': true }),
})
```

上面两个示例效果是相同的，只有 `age` 字段是模拟的。

## 自动化

现在，我们得到了结构化的由安全字段类型组成的集合。  
接下来，我们赋予其自动化编程的能力。  
由此，我们便实现了结构、安全、自动化的数据结构化编程。

## 定义函数

在保证结构体概念纯粹性的情况下，我们提供了隐式的函数来实现自动化。  
这样我们就能依旧按原有的简单方式来使用结构体。  
所以我们认知到，结构体上只有字段，并且一直都是只有字段，这就是简单纯粹性。

使用 [funcdef](/api/#funcdef) 来定义函数。

```ts
const MyStruct = typedef({
  name: string,
  sex: bool,
  intro: string,
})

// 定义函数
funcdef(
  MyStruct,
  'generateIntroduction', // 函数名
  {
    // 待观察的字段描述（可以理解为参数）
    name: true,
    sex: true,
  },
  (self: Struct) => {
    // 函数体
    // 结构体的字段值，可以理解为函数返回值
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
  }
)
```

这和普通函数由名称、参数、函数体、返回值几部分组成的原理一样。  
其中参数部分，我们换成了 **待观察的字段描述** 这一个新的概念。  
返回值，我们换成了结构体的字段值。

我们需要简单讲一下原理，来了解函数的行为方式。

首先，我们的函数是定义于结构体上的，我们使用结构体的字段来作为参数。  
那么问题来了，什么时候触发函数呢？当然是参数全部传入的时候。  
问题二，怎么算是参数传入呢？字段赋值就是参数传入。  
所以，当待观察的字段都被赋值时，就会自动执行函数。  
我们由此也能获知一个特性，就是参数传入不依赖于顺序。这个概念也很重要。  
这样我们就容易理解了：**当预期的字段数据都准备好时，会自动执行函数。**

::: tip 提示
这就方便让我们的思维方式转变成：**为结构体填充数据，就能获得结果。**  
编程就是填充数据。是不是豁然开朗了。
:::

## 使用函数

我们不需要明确指定调用函数，我们只需要为结构体的字段赋值。  
如果函数应该执行，那么它就会在合适的时机执行。一切都是自动化的。

所以我们对结构体的唯一操作就是为字段赋值。这保持了操作的单一性。

```ts
const myself = typeinit(MyStruct)
myself.name = 'Amy'
myself.sex = true
// name 和 sex 被赋值，会自动执行 generateIntroduction 生成个人介绍
console.log(myself.intro)
// output: My name is Amy, I am a girl.
```

只要输入数据都准备好了，那么就能获得输出数据。  
这让我们无需思考背后的逻辑复杂性，只需要关注于输入和输出的结果。减少了许多心智负担。

## 观察子结构体

这是一个独具魅力的设计方案。  
我们不单能观察结构体的直接字段，也能观察到子结构体的字段。  
这赋予了我们强大的操控能力。我们会经常使用到。

```ts
const Contact = typedef({
  phone: string,
  email: string,
})
const MyStruct = typedef({
  name: string,
  sex: bool,
  contact: Contact,
  intro: string,
})
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    name: true,
    sex: true,
    contact: {
      phone: true,
      email: true,
    },
  },
  (self: Struct) => {
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
    if (self.contact) {
      self.intro += `
My phone number is ${self.contact.phone} and email is ${self.contact.email}.`
    }
  }
)
const myself = typeinit(MyStruct)
myself.name = 'Amy'
myself.sex = true
myself.contact.phone = 'xxx'
myself.contact.email = 'xxx'
console.log(myself.intro)
// output:
// My name is Amy, I am a girl.
// My phone number is xxx and email is xxx.
```

我们直接赋值新的子结构体，这也就意味着子结构体的字段全部发生变化。  
这两个示例的效果是相同的。

```ts
const myself = typeinit(MyStruct)
myself.name = 'Amy'
myself.sex = true
myself.contact = typeinit(Contact, {
  phone: 'xxx',
  email: 'xxx',
})
console.log(myself.intro)
```

## 待观察的字段描述

用来描述需要观察结构体上的哪些字段。也包括子结构体的字段。

另外，我们也提供了几个描述符，可以描述字段的特殊行为。

## @notnil

用来表明该字段不能为空，也就是只有赋值不为空时，才算满足赋值条件。  
这让我们能在函数体里安全的使用字段。

```ts
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    name: true,
    sex: true,
    contact: {
      '@notnil': true, // 表明 contact 不能为空，所以函数体里可以安全使用该字段。
      phone: true,
      email: true,
    },
  },
  (self: Struct) => {
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.
My phone number is ${self.contact.phone} and email is ${self.contact.email}.`
  }
)
const myself = typeinit(MyStruct)
myself.name = 'Amy'
myself.sex = true
myself.contact = null
// 此时尚未触发生成个人介绍的函数，
// intro 依然为空，因为 contact 未被有效赋值
console.log(myself.intro)

myself.contact = typeinit(Contact, {
  phone: 'xxx',
  email: 'xxx',
})
// 此时 contact 才算被赋值，生成个人介绍
console.log(myself.intro)
// output:
// My name is Amy, I am a girl.
// My phone number is xxx and email is xxx.
```

这样，即使子结构体暂时还不存在，我们也能提前预设条件，能够极大方便编程。  
一旦子结构体被赋值，那么就会满足条件触发函数。所有都按照预期正常执行。

## @diff

用来忽略相同的赋值，也就是只有赋值不同时，才算满足赋值条件。

```ts
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    name: { '@diff': true },
    sex: true,
    contact: {
      phone: true,
      email: true,
    },
  },
  (self: Struct) => {
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.
My phone number is ${self.contact.phone} and email is ${self.contact.email}.`
  }
)
const myself = typeinit(MyStruct)
myself.name = 'Amy'
myself.sex = true
myself.contact = typeinit(Contact, {
  phone: 'xxx',
  email: 'xxx',
})
console.log(myself.intro)
// output:
// My name is Amy, I am a girl.
// My phone number is xxx and email is xxx.

myself.intro = ''

myself.contact = myself.contact
myself.sex = false
myself.name = 'Amy'
// 此时 intro 依然为空，因为 name 的值没有改变
console.log(myself.intro)

myself.name = 'Ron'
console.log(myself.intro)
// output:
// My name is Ron, I am a boy.
// My phone number is xxx and email is xxx.
```

如果应用于子结构体上，那么有两种情况。

情况一，若未观察子结构体的字段，那么必须赋值不同的子结构体才算赋值。

```ts
const MyStruct = typedef({
  contact: Contact,
  intro: string,
})
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    contact: { '@diff': true },
  },
  (self: Struct) => {
    self.intro = `My phone number is ${self.contact.phone} and email is ${self.contact.email}.`
  }
)
const myself = typeinit(MyStruct)
myself.contact = typeinit(Contact, {
  phone: 'xxx',
  email: 'xxx',
})
console.log(myself.intro)
// output: My phone number is xxx and email is xxx.

myself.intro = ''

myself.contact = myself.contact
// 此时 intro 依然为空，因为 contact 未改变
console.log(myself.intro)

myself.contact = typeinit(Contact, {
  phone: '***',
  email: '***',
})
console.log(myself.intro)
// output: My phone number is *** and email is ***.
```

情况二，如果也观察了子结构体的字段，那么除了必须赋值不同的结构体外，子结构体内部的字段改变也算是整个子结构体发生改变。

```ts
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    contact: {
      '@diff': true,
      phone: true,
      email: true,
    },
  },
  (self: Struct) => {
    self.intro = `My phone number is ${self.contact.phone} and email is ${self.contact.email}.`
  }
)
const myself = typeinit(MyStruct)
myself.contact = typeinit(Contact, {
  phone: 'xxx',
  email: 'xxx',
})
console.log(myself.intro)
// output: My phone number is xxx and email is xxx.

myself.intro = ''

myself.contact.phone = '***'
myself.contact.email = '***'
// 由于观察了内部字段，因此 contact 也算是发生了改变
console.log(myself.intro)
// output: My phone number is *** and email is ***.
```

## @or

只要结构体的待观察字段有一个发生改变，那么就算所有字段都满足条件。  
只能用于描述结构体。

之前都是在所有字段都发生改变时，才算满足触发函数的条件。  
现在我们来讲一下，不需要字段全部发生改变，就可以触发函数的情况。

```ts
const MyStruct = typedef({
  name: string,
  sex: bool,
  intro: string,
})
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    '@or': true,
    name: true,
    sex: true,
  },
  (self: Struct) => {
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
  }
)
const myself = typeinit(MyStruct)
myself.name = 'Ron'
console.log(myself.intro) // output: My name is Ron, I am a boy.

myself.name = 'Amy'
console.log(myself.intro) // output: My name is Amy, I am a boy.

myself.sex = true
console.log(myself.intro) // output: My name is Amy, I am a girl.
```

## 同时使用多个函数

一个结构体上可以定义多个函数。  
其中，待观察的字段描述可以相同，也可以不同。
所以，某一个字段被赋值时，可能会同时执行多个函数，执行顺序按照函数定义的顺序，越早定义，越早执行。

```ts
const MyStruct = typedef({
  name: string,
  sex: bool,
  intro: string,
  homepage: string,
})

funcdef(
  MyStruct,
  'generateIntroduction',
  {
    name: true,
    sex: true,
  },
  (self: Struct) => {
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
    console.log(1)
  }
)

funcdef(
  MyStruct,
  'generateHomepage',
  {
    name: true,
    sex: true,
  },
  (self: Struct) => {
    self.homepage = `https://example.com/${self.sex ? 'female' : 'male'}/${
      self.name
    }`
    console.log(2)
  }
)

const myself = typeinit(MyStruct)
myself.name = 'Amy'
myself.sex = true
// 同时执行两个函数，执行顺序为：先生成个人介绍，然后生成个人首页
// output: 1
// output: 2
```

即使靠后定义的函数，所观察的字段比之前定义的函数少，也严格按照定义顺序执行。

```ts
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    name: true,
    sex: true,
  },
  (self: Struct) => {
    self.intro = `My name is ${self.name}, I am a ${self.sex ? 'girl' : 'boy'}.`
    console.log(1)
  }
)

funcdef(
  MyStruct,
  'generateHomepage',
  {
    name: true, // 只观察名字
  },
  (self: Struct) => {
    self.homepage = `https://example.com/${self.name}`
    console.log(2)
  }
)

const myself = typeinit(MyStruct)
myself.sex = true
// 延后设置名字
myself.name = 'Amy'
// 同时执行两个函数，执行顺序为：先生成个人介绍，然后生成个人首页
// output: 1
// output: 2
```

## outcome

获取函数的执行结果。

我们推荐将结果作为结构体的字段值，但是某些时候我们依然想获得这个函数的执行结果。  
比如，我们需要确认函数是否被执行了，因为函数可能是异步的。  
所以 [outcome](/api/#outcome) 返回一个 `Promise`。

```ts
// 在函数执行前，提前预定函数的结果
const asyncResult = outcome(myself, 'generateIntroduction')
myself.name = 'Amy'
myself.sex = true
await asyncResult // done
```

大部分情况，我们更多需要获取的是结构体上的第一个函数结果。  
所以，我们提供了一个简便的方式，无需函数名就能获得结果。

```ts
const asyncResult = outcome(myself)
myself.name = 'Amy'
myself.sex = true
await asyncResult // done
```

## structbody

用来获取结构体类型的所有字段。

有些时候结构体的字段类型是匿名的，所以我们提供了此方法来获取字段的类型。

```ts
const MyStruct = typedef({
  contact: typedef({
    phone: string,
    email: string,
  }),
})
// 获取匿名的字段类型
const Contact = structbody(MyStruct).contact
```

## structof

用来获取结构体实例的类型。

```ts
const myself = typeinit(MyStruct)
console.log(structof(myself) === MyStruct)
// output: true

const DecoratedStruct = typedef({
  '@type': MyStruct,
})
console.log(structof(typeinit(DecoratedStruct)) === DecoratedStruct)
// output: true
```

## 自引用的结构体

比如需要实现一个链表。

我们首先需要定义一个空的结构体，然后再定义结构体的字段。

```ts
const Node = typedef({})
typedef(
  {
    next: Node,
  },
  Node
)
```

由于这是一个自引用的结构体，所以初始化时不会自动初始化自引用的字段，不然就会无限循环。

```ts
const node = typeinit(Node)
console.log(node)
// output: { next: undefined }
```

## 在修饰结构体上定义函数

我们除了可以直接在结构体上定义函数，也可以在修饰的结构体上定义函数。  
这样我们就在不影响原结构体的情况下，赋予结构体更多的自动化能力。

这符合修饰的准则。

## 继承 & 组合 & 扩展

::: warning 注意
如果你熟悉继承，那么这里需要注意了，在这里没有任何的继承关系。  
如果你想扩展一个结构体，那么你应该重新定义一个新的结构体，采用组合的方式，将原结构体声明为一个字段。  
也正好，这种方式赋予了我们组合多个结构体的能力。并能保持简单清晰，这很有好处。
:::

## 在实例上定义函数

我们提出另一个值得思考的问题，如何在一个已经实例化的结构体上定义函数呢？  
某些情况下，我们确实需要这种能力，来帮助我们扩展。

假设可以在结构体实例上定义函数，那么会侵入影响这个实例，永远无法回到原始状态。  
所以，系统没有提供这种方法，就是为了保证实例的恒定稳定状态。  
不过，我们有更好的方案。

我们可以定义一个新的结构体，并将这个实例的类型定义为子结构体字段，这样就可以在这个新的结构体上定义函数了。
由于我们可以观察到子结构体的内部字段，所以我们就能在保证实例状态的前提下，非侵入式的实现扩展。

```ts
// 定义一个临时结构体类型
const TempStruct = typedef({
  ref: structof(myself), // 获取实例的类型
})
funcdef(
  TempStruct,
  'tempFunc',
  {
    ref: {
      name: true,
      sex: true,
    },
  },
  (self: Struct) => {
    console.log(self.name, self.sex ? 'female' : 'male')
  }
)
// 初始化，将原实例附加到这个新的临时结构上
const temp = typeinit(TempStruct, {
  ref: myself,
})
// 现在，就可以观察到子结构体的变化了
myself.name = 'Amy'
myself.sex = true
// output: Amy female

// 解除绑定也很简单
temp.ref = null
// myself 又回到了原来的状态，仿佛一切都没有发生过
```

## 字段类型描述符

我们来介绍一些只适用于结构体的字段类型描述符。  
这能帮助我们了解结构体的一些特殊能力。

## @noinit

强制表明不自动初始化，始终返回 `undefined`。

只有用作结构体的字段类型时，才有效。如果直接初始化，会忽略此标志，依然正常返回默认值。

```ts
const Contact = typedef({
  '@noinit': true,
  phone: string,
  email: string,
})
const MyStruct = typedef({
  name: string,
  sex: bool,
  contact: Contact,
})

console.log(typeinit(MyStruct))
// output: { name: '', sex: false, contact: undefined }

// 不过直接初始化类型时，依然能获得正常的默认值。
console.log(typeinit(Contact))
// output: { phone: '', email: '' }
```

有些时候，我们并不想在初始化结构体时，默认初始化全部字段，希望某些字段默认为空。  
那么我们就可以使用此描述符。

## @retain & @release

这是一对修饰符，用来修饰类型为 `Struct` 或 `any` 的字段类型。

这并不常用，但在某些场景下，这会非常有用并且好用。  
比如：引用计数，或者追踪引用情况。

```ts
const Ref = typedef({
  '@retain': (self: Struct, parentStruct: Struct, fieldName: string) => {
    self.count++
  },
  '@release': (self: Struct, parentStruct: Struct, fieldName: string) => {
    self.count--
  },
  count: int32,
})
const Container = typedef({
  ref: Ref,
})

const ref = typeinit(Ref)
console.log(ref.count) // output: 0
// 这是因为 ref 并为被任何结构体引用，所以计数为 0

const conA = typeinit(Container)
const conB = typeinit(Container)
console.log(conA.ref.count, conB.ref.count, conA.ref !== ref, conB.ref !== ref)
// output: 1 1 true true
// 因为 Container 初始化时会默认初始化内部的 Ref，
// 并且会立刻被 Container 所引用，
// 所以 conA.ref.count 为 1

const refA = conA.ref
conA.ref = ref
console.log(ref.count, refA.count)
// output: 1 0
// 此时 ref 被 conA 引用了一次，所以 ref.count 为 1
// 由于旧的 refA 被 conA 释放，所以 refA.count 为 0

conB.ref = ref
console.log(ref.count, conA.ref.count, conB.ref.count)
// output: 2 2 2
// 此时 ref 被 conA 和 conB 引用了 2 次

conA.ref = null
console.log(ref.count) // output: 1
conB.ref = null
console.log(ref.count) // output: 0
```

## @class

用来设置结构体的原型为自定义的类。

这让我们能使用面向对象的方式来使用结构体，可以在结构体上使用方法。  
但是如非必要，我们不建议这么做。因为结构体应该保持纯粹性，只用来组织字段。

```ts
class Profile {
  name?: string
  sex?: boolean

  constructor() {
    // 注意：这里不会调用
    // 因为，通过 typeinit 初始化时，我们无法知晓构造参数的状态
  }

  print() {
    console.log(`My name is ${this.name}, I am a ${this.sex ? 'girl' : 'boy'}.`)
  }
}

const MyStruct = typedef({
  '@class': Profile,
  name: string,
  sex: bool,
})

const myself = typeinit(MyStruct, {
  name: 'Amy',
  sex: true,
})
console.log(myself instanceof Profile) // output: true
myself.print() // output: My name is Amy, I am a girl.
```

## @change

用来标记手动管理数据内部变动情况。  
适用于 `any` 类型。

因为只有 `Struct` 是可以自动响应变化的，但有些情况下，我们也希望自定义的类型也能具备响应性。  
所以，那么我们就需要手动让其具备响应性。

比如：我们希望数组元素的变动也能触发响应性。

```ts
const ReactiveArray = typedef({
  '@type': array,
  '@change': true,
})
const ReactiveStruct = typedef({
  arr: ReactiveArray,
  hash: int32,
})
funcdef(
  ReactiveStruct,
  'hash',
  {
    arr: true,
  },
  (self: Struct) => {
    let hash = 5381
    for (const v of self.arr) {
      hash += (hash << 5) + v
    }
    self.hash = hash | 0
  }
)
const rs = typeinit(ReactiveStruct)
const arr = rs.arr
arr[0] = 0
// 因为 arr 没有被重新赋值，所以函数不会执行
console.log(rs.hash) // output: 0

// 手动说明 arr 的内部发生变化了
change(arr)
console.log(rs.hash) // output: 177573
arr[1] = 1
change(arr)
console.log(rs.hash) // output: 5859910
```

内置的 [CArray](/api/#carray) 就是使用 [change](/api/#change) 和 `Proxy` 来实现的。

::: warning 提示
我还是我，但我已经不是原来的那个我了。
:::
