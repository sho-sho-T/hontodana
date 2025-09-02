"use server";

import { z } from "zod";
import { PROFILE_ERROR_MESSAGES } from "@/lib/constants/profile-errors";
import { prisma } from "@/lib/prisma";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type {
	ImageUploadResult,
	ProfileActionResult,
	UserProfileData,
	UserProfileUpdateData,
	UserSettingsUpdateData,
} from "@/types/profile";

// バリデーションスキーマ
const profileUpdateSchema = z.object({
	name: z
		.string()
		.min(1, PROFILE_ERROR_MESSAGES.NAME_REQUIRED)
		.max(50, PROFILE_ERROR_MESSAGES.NAME_TOO_LONG),
	avatarUrl: z.string().url().optional().nullable(),
	readingGoal: z.number().min(1).max(365).optional().nullable(),
});

const settingsUpdateSchema = z.object({
	theme: z.enum(["light", "dark", "system"]),
	displayMode: z.enum(["grid", "list"]),
	booksPerPage: z.enum(["10", "20", "50", "100"]),
	defaultBookType: z.enum(["physical", "kindle", "epub", "audiobook", "other"]),
});

const allowedImageTypes = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];
const maxFileSize = 2 * 1024 * 1024; // 2MB

/**
 * 現在のユーザープロフィールを取得
 */
export async function getUserProfile(): Promise<
	ProfileActionResult<UserProfileData>
> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
			};
		}

		const profile = await prisma.userProfile.findUnique({
			where: { id: user.id },
		});

		if (!profile) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND,
			};
		}

		return {
			success: true,
			data: {
				id: profile.id,
				name: profile.name,
				avatarUrl: profile.avatarUrl,
				theme: profile.theme as "light" | "dark" | "system",
				displayMode: profile.displayMode as "grid" | "list",
				booksPerPage: profile.booksPerPage as 10 | 20 | 50 | 100,
				defaultBookType: profile.defaultBookType,
				readingGoal: profile.readingGoal,
				createdAt: profile.createdAt,
				updatedAt: profile.updatedAt,
			},
		};
	} catch (error) {
		console.error("Failed to get user profile:", error);
		return {
			success: false,
			error: PROFILE_ERROR_MESSAGES.UNEXPECTED_ERROR,
		};
	}
}

/**
 * ユーザープロフィールを更新
 */
export async function updateUserProfile(
	data: UserProfileUpdateData
): Promise<ProfileActionResult<UserProfileData>> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
			};
		}

		// バリデーション
		const validation = profileUpdateSchema.safeParse(data);
		if (!validation.success) {
			const firstError = validation.error.issues[0];
			return {
				success: false,
				error: firstError.message,
			};
		}

		// 読書目標の範囲チェック
		if (data.readingGoal !== null && data.readingGoal !== undefined) {
			if (data.readingGoal < 1 || data.readingGoal > 365) {
				return {
					success: false,
					error: PROFILE_ERROR_MESSAGES.READING_GOAL_INVALID,
				};
			}
		}

		const updatedProfile = await prisma.userProfile.update({
			where: { id: user.id },
			data: {
				name: data.name,
				avatarUrl: data.avatarUrl,
				readingGoal: data.readingGoal,
			},
		});

		return {
			success: true,
			data: {
				id: updatedProfile.id,
				name: updatedProfile.name,
				avatarUrl: updatedProfile.avatarUrl,
				theme: updatedProfile.theme as "light" | "dark" | "system",
				displayMode: updatedProfile.displayMode as "grid" | "list",
				booksPerPage: updatedProfile.booksPerPage as 10 | 20 | 50 | 100,
				defaultBookType: updatedProfile.defaultBookType,
				readingGoal: updatedProfile.readingGoal,
				createdAt: updatedProfile.createdAt,
				updatedAt: updatedProfile.updatedAt,
			},
		};
	} catch (error) {
		console.error("Failed to update user profile:", error);
		return {
			success: false,
			error: PROFILE_ERROR_MESSAGES.UPDATE_FAILED,
		};
	}
}

/**
 * ユーザー設定を更新
 */
export async function updateUserSettings(
	data: UserSettingsUpdateData
): Promise<ProfileActionResult<UserProfileData>> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
			};
		}

		// バリデーション
		const validation = settingsUpdateSchema.safeParse(data);
		if (!validation.success) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.SAVE_FAILED,
			};
		}

		const updatedProfile = await prisma.userProfile.update({
			where: { id: user.id },
			data: {
				theme: data.theme,
				displayMode: data.displayMode,
				booksPerPage: data.booksPerPage,
				defaultBookType: data.defaultBookType,
			},
		});

		return {
			success: true,
			data: {
				id: updatedProfile.id,
				name: updatedProfile.name,
				avatarUrl: updatedProfile.avatarUrl,
				theme: updatedProfile.theme as "light" | "dark" | "system",
				displayMode: updatedProfile.displayMode as "grid" | "list",
				booksPerPage: updatedProfile.booksPerPage as 10 | 20 | 50 | 100,
				defaultBookType: updatedProfile.defaultBookType,
				readingGoal: updatedProfile.readingGoal,
				createdAt: updatedProfile.createdAt,
				updatedAt: updatedProfile.updatedAt,
			},
		};
	} catch (error) {
		console.error("Failed to update user settings:", error);
		return {
			success: false,
			error: PROFILE_ERROR_MESSAGES.SAVE_FAILED,
		};
	}
}

/**
 * アバター画像をアップロード
 */
export async function uploadAvatarImage(
	file: File
): Promise<ProfileActionResult<ImageUploadResult>> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
			};
		}

		// ファイルサイズチェック
		if (file.size > maxFileSize) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.FILE_TOO_LARGE,
			};
		}

		// ファイル形式チェック
		if (!allowedImageTypes.includes(file.type)) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.INVALID_FILE_TYPE,
			};
		}

		const supabase = await createClient();

		// ファイル名生成（ユニーク）
		const fileExt = file.name.split(".").pop();
		const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

		// Supabase Storageにアップロード
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("avatars")
			.upload(fileName, file, {
				cacheControl: "3600",
				upsert: true,
			});

		if (uploadError) {
			console.error("Upload error:", uploadError);
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.UPLOAD_FAILED,
			};
		}

		// 公開URLを取得
		const {
			data: { publicUrl },
		} = supabase.storage.from("avatars").getPublicUrl(fileName);

		// プロフィールのavatarUrlを更新
		await prisma.userProfile.update({
			where: { id: user.id },
			data: { avatarUrl: publicUrl },
		});

		return {
			success: true,
			data: {
				success: true,
				url: publicUrl,
			},
		};
	} catch (error) {
		console.error("Failed to upload avatar image:", error);
		return {
			success: false,
			error: PROFILE_ERROR_MESSAGES.UPLOAD_FAILED,
		};
	}
}

/**
 * アバター画像を削除
 */
export async function deleteAvatarImage(): Promise<ProfileActionResult<void>> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
			};
		}

		// プロフィールのavatarUrlをnullに更新
		await prisma.userProfile.update({
			where: { id: user.id },
			data: { avatarUrl: null },
		});

		return {
			success: true,
		};
	} catch (error) {
		console.error("Failed to delete avatar image:", error);
		return {
			success: false,
			error: PROFILE_ERROR_MESSAGES.DELETE_FAILED,
		};
	}
}
