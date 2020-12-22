module.exports = {
	base: '/rainforest-js/',
	title: 'rainforest-js',
	description: 'rainforest-js 类型描述系统',
	themeConfig: {
		repo: 'rainforesters/rainforest-js',
		docsDir: 'docs',
		docsBranch: 'docs',
		editLinks: true,
		editLinkText: '参与编辑文档🌲',
		lastUpdated: '上次更新',
		nav: [
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
					title: '教程',
					collapsable: false,
					children: [
						'',
						'getting-started',
						'typedesc',
						'descriptors',
						'struct',
					],
				},
			],
			'/api/': 'auto',
		},
	},
}
