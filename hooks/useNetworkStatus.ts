/**
 * ネットワーク状態を監視するカスタムフック
 */

"use client";

import { useEffect, useState } from "react";

export interface NetworkStatus {
	isOnline: boolean;
	isSlowConnection: boolean;
	effectiveType?: string;
}

export function useNetworkStatus(): NetworkStatus {
	const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
		isOnline: true,
		isSlowConnection: false,
	});

	useEffect(() => {
		// 初期状態の設定
		const updateNetworkStatus = () => {
			const isOnline = navigator.onLine;

			// ネットワーク情報の取得（対応ブラウザのみ）
			const connection =
				(navigator as any).connection ||
				(navigator as any).mozConnection ||
				(navigator as any).webkitConnection;

			let isSlowConnection = false;
			let effectiveType: string | undefined;

			if (connection) {
				effectiveType = connection.effectiveType;
				// 2Gまたは低速ネットワークを検知
				isSlowConnection = ["slow-2g", "2g"].includes(connection.effectiveType);
			}

			setNetworkStatus({
				isOnline,
				isSlowConnection,
				effectiveType,
			});
		};

		// 初期状態を設定
		updateNetworkStatus();

		// イベントリスナーの設定
		const handleOnline = () => {
			setNetworkStatus((prev) => ({ ...prev, isOnline: true }));
		};

		const handleOffline = () => {
			setNetworkStatus((prev) => ({ ...prev, isOnline: false }));
		};

		const handleConnectionChange = () => {
			updateNetworkStatus();
		};

		// イベントリスナーを追加
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// ネットワーク情報の変化を監視
		const connection = (navigator as any).connection;
		if (connection) {
			connection.addEventListener("change", handleConnectionChange);
		}

		// クリーンアップ
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);

			if (connection) {
				connection.removeEventListener("change", handleConnectionChange);
			}
		};
	}, []);

	return networkStatus;
}
