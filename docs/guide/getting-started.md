# 快速开始

这里通过一个简单的示例，来快速掌握结构体的用法。体验数据结构化编程的魅力。

## 定义结构体

首先来定义一个简单的结构体。

```ts
const MyStruct = typedef({
  name: string,
  sex: bool,
  age: int32,
  intro: string,
})
```

## 初始化结构体

然后初始化我们定义的结构体。  
所有字段都会自动初始化为类型的默认值。

```ts
const myself = typeinit(MyStruct)
console.log(myself)
// output: { name: '', sex: false, age: 0, intro: '' }
```

## 使用函数

先为结构体定义函数。  
期望当名字、性别、年龄发生变化时，自动生成个人介绍。

```ts
funcdef(
  MyStruct,
  'generateIntroduction',
  {
    // 声明需要观察的字段
    name: true,
    sex: true,
    age: true,
  },
  (self: typeinit<typeof MyStruct>) => {
    self.intro = `My name is ${self.name}, I am a ${
      self.sex ? 'girl' : 'boy'
    } and I am ${self.age} years old.`
  }
)
```

然后初始化结构体，并为字段赋值。

```ts
const myself = typeinit(MyStruct)
myself.name = 'Amy'
myself.sex = true
myself.age = 18
// 此时，预期的名字、性别、年龄发生变化了，
// 将会自动执行函数，生成个人介绍。
console.log(myself.intro)
// output: My name is Amy, I am a girl and I am 18 years old.
```

我们并没有手动调用函数来生成个人介绍，一切都是自动完成的。  
这让我们能专注于编排数据结构，即可获得目标结果，而不用控制复杂的过程。

::: warning 提示
函数是何时触发的？  
当预期的最后一个字段变化时，会自动执行函数。  
也就是表明：**当预期的字段数据都准备好时，会自动执行函数。**
:::
