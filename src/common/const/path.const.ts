import { join } from "path";

export const PROJECT_ROOT_PATH = process.cwd();

export const PUBLIC_FOLDER_NAME = 'public';

export const USERS_FOLDER_NAME = 'users';

export const TEMP_FOLDER_NAME = 'temp';

export const PUBLIC_FOLDER_PATH = join(
  PROJECT_ROOT_PATH,
  PUBLIC_FOLDER_NAME,
)

export const USER_IMAGE_PATH = join(
  PUBLIC_FOLDER_PATH,
  USERS_FOLDER_NAME,
)

export const USER_PUBLIC_IMAGE_PATH = join(
  PUBLIC_FOLDER_NAME,
  USERS_FOLDER_NAME,
)

export const TEMP_FOLDER_PATH = join(
  PUBLIC_FOLDER_PATH,
  TEMP_FOLDER_NAME,
)