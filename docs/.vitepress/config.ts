import { defineConfig } from 'vitepress'

export default defineConfig({
	title: 'IMSURE',
	description: 'imsure',

	base: '/imsure/',

	lastUpdated: false,

	/* prettier-ignore */
	head: [
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/imsure/logo.svg' }],
	],

	themeConfig: {
		logo: '/logo.svg',

		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/rainforesters/imsure',
			},
		],

		sidebar: {
			'/guide/': {
				base: '/guide/',
				items: [
					{
						text: '开始',
						items: [
							{ text: '简介&收费', link: 'introduction' },
							{ text: '快速开始', link: 'getting-started' },
							{ text: '编程思想', link: 'thinking' },
						],
					},
					{
						text: '教程',
						items: [
							{ text: '定义一个规则', link: 'ruledef' },
							{ text: '定义一个类型', link: 'typedef' },
						],
					},
					{
						text: '其他',
						items: [{ text: '在 Vue 中使用', link: 'vue' }],
					},
				],
			},
		},

		footer: {
			message: 'MIT Licensed',
			copyright: 'Copyright © Rainforesters',
		},

		docFooter: {
			prev: '上一页',
			next: '下一页',
		},

		outline: {
			label: '本页内容',
		},

		lastUpdated: {
			text: '最后更新于',
			formatOptions: {
				dateStyle: 'short',
				timeStyle: 'medium',
			},
		},

		langMenuLabel: '多语言',
		returnToTopLabel: '回到顶部',
		sidebarMenuLabel: '菜单',
		darkModeSwitchLabel: '主题',
		lightModeSwitchTitle: '切换到浅色模式',
		darkModeSwitchTitle: '切换到深色模式',

		search: {
			provider: 'local',
		},
	},
})
