# 定义一个规则

我们一起来学习如何**定义规则**来解决实际问题。比如需求：在下单页面，根据所选地址或物流方式来计算运费。

<!-- prettier-ignore-start -->
```ts{18-28}
const Order = typedef({
    address: typedef({
        id: string,
    }),
    express: typedef({
        code: string,
    }),
    freight: money,
})

const PlaceOrderPage = typedef({
    order: Order,
})

ruledef(
    PlaceOrderPage,
    'calcFreight', // 规则名
    { // 观察字段
        order: {
            '@or': true,
            address: {
                id: true,
            },
            express: {
                code: true,
            },
        },
    },
    async (self) => {
        self.order.freight = await Api.calcFreight({
            address_id: self.order.address.id,
            express_code: self.order.express.code,
        })
    }
)

// 初始化页面
const placeOrderPage = typeinit(PlaceOrderPage)
// 切换地址或物流
placeOrderPage.order.address.id = 'xxx'
placeOrderPage.order.express.code = 'xxx'
```
<!-- prettier-ignore-end -->

看上面高亮部分，我们深入并精确地观察到了全部目标字段。无论是切换地址还是切换物流，计算运费的规则都会执行，简单直接、安全可靠。
观察字段就是规则被触发的条件，一旦字段更新，就会自动触发规则。

## 描述符号

在观察字段中，我们使用了一个特殊的描述符号`@or`来描述多个字段之间是或者关系。任何一个字段更新，都会满足该层条件，并向上层冒泡，直到顶层也满足条件就会触发规则。若没有`@or`符号，则同层所有字段都更新才算满足条件。

---

仔细看，上面的代码有一个可以优化的地方如：当选择相同地址或相同物流时，也会触发计算运费的规则。我们来改进它，如下：

<!-- prettier-ignore-start -->
```ts
            address: {
                id: true, // [!code --]
                id: { '@diff': true }, // [!code ++]
            },
            express: {
                code: true, // [!code --]
                code: { '@diff': true }, // [!code ++]
            },
```
<!-- prettier-ignore-end -->

我们用了一个新描述符号`@diff`，这样只有当字段更新为新值时，才会触发规则。选择相同地址或物流时，就不会重复计算运费了。

---

有时候字段可能为空(`undefined,null`)，我们不希望触发规则。可以使用描述符号`@notnil`来解决。

## 在规则中使用递归

严格来讲，是不能使用递归写法的，但是我们可以变通一下。比如：若商品限购，如何控制购物车的商品数量。

<!-- prettier-ignore-start -->
```ts{25-27}
const Product = typedef({
    id: string,
    maxQuantity: int32,
})

const CartProduct = typedef({
    id: string,
    quantity: int32,
    product: Product,
})

ruledef(
    CartProduct,
    'quantity',
    {
        quantity: true,
    },
    (self) => {
        let { quantity } = self
        const { maxQuantity } = self.product
        if (maxQuantity && quantity > maxQuantity) {
            quantity = maxQuantity
        }
        if (quantity !== self.quantity) {
            setTimeout(() => {
                self.quantity = quantity
            })
        }
    }
)
```
<!-- prettier-ignore-end -->

由于结构体都是开放的、纯粹的，所以无法在赋值时进行拦截。不过我们可以通过定义一个规则来观察某个字段并修正自己。这就导致了递归，因为递归可能会导致堆栈溢出，所以我们巧妙地借助`setTimeout`来放空当前堆栈，在下一个调用帧来修正自己。

## 两个规则互相触发

有这么一种情况，规则A会触发规则B，规则B会触发规则A，陷入循环。怎么办呢？如果两个规则不互相触发就好了。

<!-- prettier-ignore-start -->
```ts{23,34}
enum OrderType {
    normal = 1,
    activity = 2,
    // ...
}

const Order = typedef({
    type: string as TypeDesc<keyof typeof OrderType>,
    typeCode: int32 as TypeDesc<OrderType>,
})

ruledef(
    Order,
    'type',
    {
        type: true,
    },
    (self) => {
        // if (self.typeCode !== OrderType[self.type]) {
        //     self.typeCode = OrderType[self.type]
        // }
        // 同上面
        self.typeCode = wrapval({ '@diff': true }, OrderType[self.type])
    }
)

ruledef(
    Order,
    'typeCode',
    {
        typeCode: true,
    },
    (self) => {
        self.type = wrapval({ '@diff': true }, OrderType[self.typeCode])
    }
)
```
<!-- prettier-ignore-end -->

没错，只有判断为新值时才更新字段，这样就能保证所有规则同时只触发一次，不会循环。为了方便，我们提供了一种新写法`wrapval({ '@diff': true }, value)`。

::: tip
`wrapval`是个新颖的特性，允许我们使用描述来包装一个值，这样就可以在赋值时提供灵活的控制力，能够实现奇妙的操作。
:::
