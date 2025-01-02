# 在 Vue 中使用

## 在 Vue 3 中使用

首先安装插件。

```sh
npm add -D unplugin-imsure
```

<!-- prettier-ignore-start -->
::: code-group

```ts [vite.config.ts]
import imsure from 'unplugin-imsure/vite'

export default defineConfig({
    plugins: [imsure()],
})
```
<!-- prettier-ignore-end -->

:::

然后就能无感使用了，所有`typeinit`会自动包裹为`reactive`，无需手动包裹。

```ts
const product = typeinit(Product)
console.log(isReactive(product)) // output: true
```

## 在 Vue 2 中使用

不需要安装任何插件。

但需要注意，由于 Vue 2 的 diff 机制，相同赋值不会触发规则，需要变通一下，借助`wrapval`包装相同值。

<!-- prettier-ignore-start -->
```ts
product.price = wrapval({}, product.price)
```
<!-- prettier-ignore-end -->
