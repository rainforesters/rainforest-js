# 定义一个类型

我们来定义一个商品类型。

<!-- prettier-ignore-start -->
```ts
const Product = typedef({
    name: string,
    price: money,
})

console.log(typeinit(Product))
// output: { name: '', price: '0.00' }
console.log(typeinit(Product, { name: 'Apple' }))
// output: { name: 'Apple', price: '0.00' }
```
<!-- prettier-ignore-end -->

这种由字段组成的结构称为：`Struct`类型。

其中还使用了金额类型，定义如下：

<!-- prettier-ignore-start -->
```ts
const money = typedef({
    '@type': string,
    '@value': () => '0.00,
    '@adjust': (self) => {
        // 仅演示，实际使用请注意精度
        return parseFloat(self).toFixed(2)
    },
})
```
<!-- prettier-ignore-end -->

这种包含描述符号`@type`的称为：修饰类型。`@type`指向的就是被修饰的类型。  
除了基础类型`bool,int32,float64,string,unknown`，还内置了从`unknown`修饰来的`object,array`，和从`array`修饰来的`CArray`。 任何类型都可以被修饰，包括`Struct`类型。

## 描述符号

修饰类型时，必须提供`@type`，若没有则表示一个`Struct`类型。

| 描述符号   | 说明                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@type`    | 被修饰的类型                                                                                                                        |
| 生成值     |                                                                                                                                     |
| `@value`   | 生成默认值                                                                                                                          |
| 初始化     | 执行顺序 `@value > @init`                                                                                                           |
| `@init`    | 自定义初始化，无返回值<br>只对`Struct,unknown`有效                                                                                  |
| 校验与修正 | 执行顺序 `@verify > @adjust > @assert`                                                                                              |
| `@verify`  | 对值进行校验，抛出错误                                                                                                              |
| `@adjust`  | 对值进行修正，返回修正后的值                                                                                                        |
| `@assert`  | 对值进行断言，抛出错误                                                                                                              |
| 引用与释放 | 极少使用<br>只对`Struct,unknown`有效                                                                                                |
| `@retain`  | 当被父结构体的字段引用时触发                                                                                                        |
| `@release` | 当从父结构体的字段释放时触发                                                                                                        |
| 其他       |                                                                                                                                     |
| `@notnil`  | 禁止`undefined,null`                                                                                                                |
| `@noinit`  | 禁用自动初始化，必须显式使用`typeinit`来初始化<br>只对`Struct,unknown`有效                                                          |
| `@change`  | 极少使用<br>标记此类型会触发观察，称为[可变类型](#change)<br>只对`unknown`有效<br>需使用`change()`令`unknown`像`Struct`一样触发观察 |

## 关于 Struct 类型

`Struct`类型是工作中最常用到的，我们来掌握几个进阶操作。

::: tip 修饰须知

- 不能在修饰中定义新字段，因为修饰不是继承。
- 修饰后可以使用`ruledef`定义新规则，但规则名不能重复。

:::

## 初始化时立刻触发规则

我们知道，只有当字段被赋值时才会触发规则，所以我们巧妙地利用`@init`来实现。

<!-- prettier-ignore-start -->
```ts{4-6}
const Product = typedef({
    price: money,
    // ...
    '@init': (self) => {
        self.price = self.price
    },
})

ruledef(
    Product,
    'price',
    {
        price: true,
    },
    (self) => {
        // ...
    }
)
```
<!-- prettier-ignore-end -->

## 递归引用

比如实现一个链表结构并不难，但要具备正确的类型提示就要动点脑筋了。

<!-- prettier-ignore-start -->
```ts
const __LinkedNode = typedef({}) as TypeDesc<unknown>
const _LinkedNode = typedef({
    value: unknown,
    next: __LinkedNode,
}, __LinkedNode as never)

type LinkedNode = typeof _LinkedNode & TypeDesc<Struct<{
    next: LinkedNode
}>>
const LinkedNode = _LinkedNode as LinkedNode
```
<!-- prettier-ignore-end -->

如上，先定义一个空结构体类型，然后再定义字段，就实现了链表结构。接下来重新定义一个递归引用的交叉类型，最后再使用类型断言，就得到正确的类型提示了。

## 循环依赖

如果有循环引用的 A B 两个类型，分别定义在两个文件中，就会导致循环依赖。这是先有鸡还是先有蛋的问题，需要我们好好发挥聪明才智才行。

我们先创建 A.ts B.ts 两个文件，并分别定义空的结构体类型，这相当于头文件，只声明但不具体实现。然后再创建 A.def.ts B.def.ts 两个文件，在其中定义具体实现。最后在使用 A B 类型前，比如在入口文件中引入一次 A.def.ts B.def.ts 就好了。

<!-- prettier-ignore-start -->
::: code-group

```ts [index.ts]
import './A.def' // [!code ++]
import './B.def' // [!code ++]
import { A } from './A'
import { B } from './B'

// 正确的类型提示
typeinit(A).b
typeinit(B).a
```

```ts [A.ts]
import type { A_def } from './A.def'

export const A = typedef({}) as A_def
```

```ts [A.def.ts]
import { A } from './A'
import { B } from './B'

const __B = B as TypeDesc<unknown>
const __A = A as TypeDesc<unknown>
const _A = typedef({
    b: __B,
}, __A as never)

export type A_def = typeof _A & TypeDesc<Struct<{
    b: typeof B
}>>
```

```ts [B.ts]
import type { B_def } from './B.def'

export const B = typedef({}) as B_def
```

```ts [B.def.ts]
import { A } from './A'
import { B } from './B'

const __A = A as TypeDesc<unknown>
const __B = B as TypeDesc<unknown>
const _B = typedef({
    a: __A,
}, __B as never)

export type B_def = typeof _B & TypeDesc<Struct<{
    a: typeof A
}>>
```

:::
<!-- prettier-ignore-end -->

::: warning Uncaught ReferenceError: Cannot access 'xxx' before initialization
遇到这个错误，大概率是循环引用导致的，需要使用此方法来解决。
:::

## 反射

极少使用。反射是从结构体实例获取其类型。比如为某个结构体实例定义规则，但该类型未知。此时就是反射的用武之地。

<!-- prettier-ignore-start -->
```ts{2}
const Delegate = typedef({
    ref: structof(someInstance),
})

ruledef(
    Delegate,
    'someRule',
    {
        ref: {
            // ...
        },
    },
    (self) => {
        // ...
    }
)

typeinit(Delegate, { ref: someInstance })
```
<!-- prettier-ignore-end -->

::: tip
此示例同时介绍了一种委托模式。使用委托，我们可以为所欲为。广义上讲，间接引用都算是委托，我们其实一直在用，却不自知而已。
:::

## 获取字段类型

极少使用。先获取到结构体类型的所有字段，然后从字段名取出该类型。

<!-- prettier-ignore-start -->
```ts{8}
const User = typedef({
    contact: typedef({
        phone: string,
        email: string,
    }),
})

const Contact = structbody(User).contact
```
<!-- prettier-ignore-end -->

## 使用数组

默认数组元素的类型都是`unknown`，若要具有正确的类型提示，需要使用类型断言。

<!-- prettier-ignore-start -->
```ts
const HomePage = typedef({
    banners: array as TypeDesc<array<typeof string>>,
    products: typedef({
        '@type': array as TypeDesc<array<typeof Product>>,
    }),
})
```
<!-- prettier-ignore-end -->

上面示例，我们使用了两种数组方式：直接使用`array`和修饰`array`（建议）。这两种没有区别，都能提供正确的类型提示。但修饰`array`的好处是，可以使用描述符号`@verify`来校验数组的元素。

还有一个`CArray`。两者的区别是，如果定义了规则观察该字段，`array`类型的索引更新时不会触发规则，而`CArray`类型的索引更新时会触发规则。因为`CArray`是[可变类型](#change)，具体细节请阅读源码。

## 可变类型{#change}

极少使用。含有描述符号`@change`的`unknown`类型，以及衍生的修饰类型，都是可变类型。配合使用`change()`可以令`unknown`像`Struct`一样触发观察。

<!-- prettier-ignore-start -->
```ts{4,22}
const HomePage = typedef({
    products: typedef({
        '@type': array as TypeDesc<array<typeof Product>>,
        '@change': true,
    }),
})

ruledef(
    HomePage,
    'products',
    {
        products: true,
    },
    (self) => {
        console.log(self.products.length)
        // ...
    }
)

const { products } = typeinit(HomePage)
products[0] = typeinit(Product)
change(products) // output: 1
```
<!-- prettier-ignore-end -->

上面示例也可以换用`CArray`来实现，其原理就使用了`change()`与`Proxy`，所以当索引更新时会自动触发规则。
