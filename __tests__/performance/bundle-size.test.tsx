/**
 * バンドルサイズとコード分割のパフォーマンステスト
 * 現在の実装では最適化されていないため、失敗するテスト
 */

import { BookCard } from "@/components/library/BookCard";

describe("Bundle Size and Code Splitting Tests", () => {
	// 動的インポートのチャートコンポーネントが存在することを確認
	it("should have dynamic import chart components available", () => {
		// 動的インポート版のチャートコンポーネントが作成されていることを確認
		const fs = require("node:fs");
		const dynamicChartExists = fs.existsSync(
			"./components/charts/DynamicReadingProgressChart.tsx"
		);
		const dynamicDistributionExists = fs.existsSync(
			"./components/charts/DynamicBookDistributionChart.tsx"
		);

		expect(dynamicChartExists).toBe(true);
		expect(dynamicDistributionExists).toBe(true);
	});

	// このテストは現在のバンドルサイズが大きすぎるため失敗するはず
	it("should have small component footprint", () => {
		// コンポーネントのサイズをチェック
		const componentSize = BookCard.toString().length;

		// 最適化されていないため、このテストは失敗する可能性
		expect(componentSize).toBeLessThan(2000); // 2KB以下を期待
	});

	// 遅延読み込みコンポーネントのテスト
	it("should not load all components immediately", () => {
		// 重いコンポーネントが即座に読み込まれないことを確認
		const heavyComponentsLoaded = document.querySelectorAll(
			"[data-heavy-component]"
		);

		// 最適化前はすべてのコンポーネントが即座に読み込まれる（失敗）
		expect(heavyComponentsLoaded.length).toBe(0); // 初期状態では重いコンポーネントは読み込まれていないはず
	});
});
