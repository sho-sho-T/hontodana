/**
 * レスポンシブユーティリティのテスト
 */

import {
	createResponsiveClasses,
	getResponsiveValue,
} from "@/lib/utils/responsive";

describe("getResponsiveValue", () => {
	test("xs値が適切に返される", () => {
		const values = {
			xs: "mobile",
			sm: "small",
			md: "medium",
			lg: "large",
		};

		// xs以下の幅（320px未満）
		expect(getResponsiveValue(values, 300)).toBe("mobile");
	});

	test("sm値が適切に返される", () => {
		const values = {
			xs: "mobile",
			sm: "small",
			md: "medium",
			lg: "large",
		};

		// sm幅（640px以上、768px未満）
		expect(getResponsiveValue(values, 700)).toBe("small");
	});

	test("md値が適切に返される", () => {
		const values = {
			xs: "mobile",
			sm: "small",
			md: "medium",
			lg: "large",
		};

		// md幅（768px以上、1024px未満）
		expect(getResponsiveValue(values, 800)).toBe("medium");
	});

	test("lg値が適切に返される", () => {
		const values = {
			xs: "mobile",
			sm: "small",
			md: "medium",
			lg: "large",
		};

		// lg幅（1024px以上、1280px未満）
		expect(getResponsiveValue(values, 1100)).toBe("large");
	});

	test("xl値が適切に返される", () => {
		const values = {
			xs: "mobile",
			sm: "small",
			md: "medium",
			lg: "large",
			xl: "extra-large",
		};

		// xl幅（1280px以上、1536px未満）
		expect(getResponsiveValue(values, 1400)).toBe("extra-large");
	});

	test("2xl値が適切に返される", () => {
		const values = {
			xs: "mobile",
			sm: "small",
			md: "medium",
			lg: "large",
			xl: "extra-large",
			"2xl": "extra-extra-large",
		};

		// 2xl幅（1536px以上）
		expect(getResponsiveValue(values, 1600)).toBe("extra-extra-large");
	});

	test("該当する値がない場合undefinedが返される", () => {
		const values = {
			md: "medium",
			lg: "large",
		};

		// xs値も設定されていない小さい画面
		expect(getResponsiveValue(values, 300)).toBeUndefined();
	});

	test("最も大きなブレークポイント以下の値が返される", () => {
		const values = {
			xs: "mobile",
			md: "medium",
		};

		// lg幅だがlg値が設定されていない
		expect(getResponsiveValue(values, 1100)).toBe("medium");
	});

	test("数値型の値で動作する", () => {
		const values = {
			xs: 1,
			sm: 2,
			md: 3,
			lg: 4,
		};

		expect(getResponsiveValue(values, 700)).toBe(2);
		expect(getResponsiveValue(values, 1100)).toBe(4);
	});

	test("真偽値型の値で動作する", () => {
		const values = {
			xs: false,
			md: true,
		};

		expect(getResponsiveValue(values, 300)).toBe(false);
		expect(getResponsiveValue(values, 800)).toBe(true);
	});
});

describe("createResponsiveClasses", () => {
	test("完全なレスポンシブクラスが生成される", () => {
		const values = {
			xs: "4",
			sm: "6",
			md: "8",
			lg: "10",
			xl: "12",
			"2xl": "16",
		};

		const result = createResponsiveClasses("grid-cols", values);

		expect(result).toBe(
			"grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-16"
		);
	});

	test("部分的なレスポンシブクラスが生成される", () => {
		const values = {
			xs: "2",
			md: "4",
			xl: "6",
		};

		const result = createResponsiveClasses("grid-cols", values);

		expect(result).toBe("grid-cols-2 md:grid-cols-4 xl:grid-cols-6");
	});

	test("値が空の場合空文字が返される", () => {
		const values = {};

		const result = createResponsiveClasses("grid-cols", values);

		expect(result).toBe("");
	});

	test("異なるプロパティで動作する", () => {
		const values = {
			xs: "center",
			md: "start",
		};

		const result = createResponsiveClasses("text", values);

		expect(result).toBe("text-center md:text-start");
	});

	test("padding値で動作する", () => {
		const values = {
			xs: "2",
			sm: "4",
			lg: "8",
		};

		const result = createResponsiveClasses("p", values);

		expect(result).toBe("p-2 sm:p-4 lg:p-8");
	});

	test("margin値で動作する", () => {
		const values = {
			xs: "1",
			md: "2",
		};

		const result = createResponsiveClasses("m", values);

		expect(result).toBe("m-1 md:m-2");
	});

	test("width値で動作する", () => {
		const values = {
			xs: "full",
			lg: "1/2",
		};

		const result = createResponsiveClasses("w", values);

		expect(result).toBe("w-full lg:w-1/2");
	});
});
