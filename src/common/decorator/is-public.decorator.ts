import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = 'is_public';

export const isPublic = () => SetMetadata(IS_PUBLIC_KEY, true);