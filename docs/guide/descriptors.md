# 类型描述符

我们定义了一些描述符来描述类型。  
描述符以 `@` 开头。

下面我们将介绍部分通用描述符。

## @type

指定待修饰的原有类型。

```ts
const int8 = typedef({
  '@type': int32,
})
```

也可以是已经定义的结构体。

```ts
const DecoratedStruct = typedef({
  '@type': MyStruct,
})
```

::: warning 提示
一般需要和其他描述符一起使用，不然没有意义。
:::

## @value

当类型初始化时，返回默认值。

```ts
'@value': () => {
  return 'amy@example.com'
}
```

如果是一个修饰类型，那么也可以对值进行再次修饰。

```ts
'@value': (val: string) => {
  return val + '.cn'
}
```

::: warning 注意
这只作用于没有使用字面量的情况，仅仅初始化类型。  
因为，这能确保修饰链的可靠性。
:::

## @mock

当类型初始化时，返回模拟的默认值。

我们开发程序时，总会需要模拟一些数据来方便开发。  
以往，我们不容易模拟一些数据来使用，现在，我们提供了这种简单的方法来生成模拟数据。

当然，你也可以配合模拟框架来生成模拟数据。

```ts
'@mock': () => {
  return (Math.random() * 100 + 1) | 0
}
```

我们可以很简单的生成模拟数据，这非常容易。

```ts
// 我们使用 wrapval({ '@mock': true }) 来生成模拟的数据
console.log(typeinit(int32, wrapval({ '@mock': true })))
```

我们使用 [wrapval](/api/#wrapval) 来将描述和原始值包装在一起。  
这里只需要描述来表明生成模拟数据，所以原始值是可以忽略的。

## @verify

用来自定义校验规则。

```ts
'@verify': (val: unknown) => {
  // 校验值是否符合预期规则，
  // 如果不符合，应抛出错误。
  throw Error('Invalid value')
}
```

推荐的做法为，不要用于结构体上，应该只用于描述基本类型。  
如果希望校验结构体的字段，那么应该直接修饰于字段的类型上。  
这样才能保证结构体的字段明确性、直观性。

## @adjust

用来对数据进行修正。

某些情况下，接收到的数据可能并不那么标准，但是也是可以兼容的。  
所以，我们可以对其修正，来标准化统一数据。

比如，自动去除字符串的前后空白字符。

```ts
'@adjust': (val: string) => {
  return val.trim()
}
```

## @init

当类型初始化时，用来对默认值进行一些额外操作。  
这是唯一的生命周期函数。在 [@value](#value) 或 [@mock](#mock) 之后，只会执行一次。

```ts
'@init': (val: Struct<{ name: string }>) => { // 注意：没有返回值
  val.name = 'Amy'
}
```

只有当数据不为 `null` 或 `undefined` 时才会执行。

因为没有返回值，所以只对 `Struct` 或 `unknown` 的类型及其修饰才有意义。

## @notnil

用来约束数据值不能为空： `null` 或 `undefined`。

如果值为空，将会抛出错误。所以，这能保障安全性。

```ts
'@notnil': true
```
