module.exports = {
	base: '/rainforest-js/',
	title: 'rainforest-js',
	description: 'rainforest-js 类型描述系统',
	themeConfig: {
		repo: 'rainforesters/rainforest-js',
		docsDir: 'docs',
		docsBranch: 'docs',
		contributors: false,
		editLinks: true,
		editLinkText: '参与编辑文档🌲',
		lastUpdatedText: '上次更新',
		navbar: [
			{
				text: '教程',
				link: '/guide/',
			},
			{
				text: 'API',
				link: '/api/',
			},
		],
		sidebar: {
			'/guide/': [
				{
					text: '教程',
					collapsable: false,
					children: [
						'README.md',
						'getting-started',
						'typedesc',
						'descriptors',
						'struct',
					],
				},
			],
		},
	},
	plugins: [
		[
			'@vuepress/plugin-search',
			{
				locales: {
					'/': {
						placeholder: 'Search',
					},
				},
			},
		],
	],
}
