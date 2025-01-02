# 简介

这是好学好用的新编程方式，会增强确定性和自信，会颠覆你的编程世界观。在这里，你不用写逻辑去控制程序运行，只有数据结构和数据转换，简单直接，称为数据转换编程思想。若你想了解更多，请去看数据流计算机，一种真正的非冯·诺依曼结构计算机。

## 关于收费 {#price}

我们热心开源，也大大方方地收费。收费方式为订阅制：

| 收费标准                                                                                                                                                            | 订阅                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 每个开发者~~每月 10$~~，限时优惠每月 1$。                                                                                                                           | <div id="paypal-button-container-P-569121704U675032PM5V4AFQ"></div> |
| 国内同胞享有优惠~~每月 10 元~~，限时优惠每月 1 元。                                                                                                                 | 请使用数字人民币转账至：0021197898055883                            |
| 或者每撰写发布 1 篇关于 Imsure 的文章，可以享有 1 个月的使用权；<br>30 天内撰写发布 2 篇，可享有 6 个月的使用权；<br>30 天内撰写发布 3 篇，可享有 12 个月的使用权。 |

若不想付费，又不想撰写文章，也允许持续免费试用，不会追讨。可以用于商业目的，享有付费后的同等权利。

<script setup>
import { loadScript } from '@paypal/paypal-js'
import { onMounted } from 'vue'

onMounted(async () => {
  const paypal = await loadScript({
    clientId:
      'AUfvH2KdtTg0TM8DdUtu4qp6Yx377_Zagy-T2MAEvuljXCDtK3DO404P_QR9S3bdaUXRz7uuwYX1Gzmn',
    vault: true,
    intent: 'subscription',
  })

  ;[
    {
      plan_id: 'P-569121704U675032PM5V4AFQ',
      container: '#paypal-button-container-P-569121704U675032PM5V4AFQ',
    },
  ].forEach((item) => {
    paypal
      .Buttons({
        style: {
          shape: 'pill',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe',
        },
        createSubscription: function (data, actions) {
          return actions.subscription.create({
            /* Creates the subscription */
            plan_id: item.plan_id,
          })
        },
        onApprove: function (data, actions) {
          // alert(data.subscriptionID) // You can add optional success message for the subscriber here
          alert('Transaction completed.')
        },
      })
      .render(item.container) // Renders the PayPal button
  })
})
</script>
